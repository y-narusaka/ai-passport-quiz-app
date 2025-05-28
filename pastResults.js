// pastResults.js

/**
 * 過去の結果を見る画面を表示する
 */
function showPastResults() {
  showScreen('past-results'); // main.jsのshowScreenを使用
  const pastResultsListDiv = document.getElementById('past-results-list');
  const pastResultsDetailsDiv = document.getElementById('past-results-details');
  const clearButton = document.querySelector('.clear-results-button');

  pastResultsListDiv.innerHTML = `<ul></ul>`;
  pastResultsDetailsDiv.innerHTML = '';

  const results = loadResults(); // ローカルストレージから結果を読み込み

  const ul = pastResultsListDiv.querySelector('ul');

  if (results.length === 0) {
    ul.innerHTML = '<li>過去の結果はありません。</li>';
    if (clearButton) clearButton.disabled = true;
  } else {
    results.slice().reverse().forEach((result, index) => {
      const originalIndex = results.length - 1 - index; // 元のインデックスを計算
      const li = document.createElement('li');
      li.textContent = `${result.date} - ${result.correct} / ${result.total} 問正解 (${((result.correct / result.total) * 100).toFixed(1)}%)`;
      li.dataset.index = originalIndex;
      li.addEventListener('click', () => displayPastResultDetails(originalIndex));
      ul.appendChild(li);
    });
    if (clearButton) clearButton.disabled = false;
  }
}

/**
 * 全ての過去のクイズ結果を削除する
 */
function clearAllResults() {
  if (confirm('全ての過去のクイズ結果を削除してもよろしいですか？この操作は元に戻せません。')) {
    localStorage.removeItem('quizResults');
    showPastResults(); // 削除後にリストを再描画
  }
}

/**
 * 過去の結果の詳細を表示する
 * @param {number} index - 表示する結果のインデックス
 */
function displayPastResultDetails(index) {
  const results = loadResults();
  const result = results[index];
  const pastResultsDetailsDiv = document.getElementById('past-results-details');
  pastResultsDetailsDiv.innerHTML = `<h2>過去のクイズ結果詳細</h2>`;

  const backButton = document.createElement('button');
  backButton.classList.add('back-button');
  backButton.textContent = '結果一覧に戻る';
  backButton.onclick = showPastResults;
  pastResultsDetailsDiv.appendChild(backButton);

  const summary = document.createElement('div');
  summary.classList.add('question-result');
  summary.innerHTML = `
    <p>日時: ${result.date}</p>
    <p>正解数: ${result.correct} / ${result.total}</p>
    <p>正答率: ${((result.correct / result.total) * 100).toFixed(1)}%</p>
  `;
  pastResultsDetailsDiv.appendChild(summary);

  result.questions.forEach((question, qIndex) => {
    const userAnswer = result.userAnswers[qIndex];
    const isCorrect = (userAnswer !== null && userAnswer.toString() === question.Answer);

    const questionResultDiv = document.createElement('div');
    questionResultDiv.classList.add('question-result');

    questionResultDiv.innerHTML = `
      <h3>問 ${question.id}: ${question.Quiz}</h3>
      <ul>
        ${question.Choice.map((choiceText, i) => {
            const match = choiceText.match(/^(\d+)\s(.*)$/);
            const choiceNumber = match ? match[1] : (i + 1).toString();
            const actualChoiceText = match ? match[2] : choiceText;
            return `
              <li class="${isCorrect && choiceNumber === question.Answer ? 'correct-answer' : (userAnswer === parseInt(choiceNumber, 10) && !isCorrect ? 'user-answer' : '')}">
                <span>${choiceNumber}</span>
                ${actualChoiceText}
              </li>
            `;
        }).join('')}
      </ul>
      <p><strong>正解:</strong> ${question.Answer}. ${question.Choice[parseInt(question.Answer) - 1].replace(/^\d+\s/, '')}</p>
      <div class="description">
        <p><strong>解説:</strong> ${question.Description}</p>
      </div>
    `;
    pastResultsDetailsDiv.appendChild(questionResultDiv);
  });
}

/**
 * ローカルストレージにクイズ結果を保存する
 * @param {Object} result - 保存するクイズ結果オブジェクト
 */
function saveResult(result) {
  let results = loadResults();
  results.push(result);
  localStorage.setItem('quizResults', JSON.stringify(results));
}

/**
 * ローカルストレージからクイズ結果を読み込む
 * @returns {Array} 読み込んだクイズ結果の配列
 */
function loadResults() {
  const resultsString = localStorage.getItem('quizResults');
  return resultsString ? JSON.parse(resultsString) : [];
}