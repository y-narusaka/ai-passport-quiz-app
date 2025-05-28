// quiz.js

// クイズ機能の変数
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
const QUIZ_TIME_LIMIT = 60 * 60; // 60分
let timerId = null;
let timeLeft = QUIZ_TIME_LIMIT;

/**
 * クイズを開始する
 */
function startQuiz() {
  const questionCountSelect = document.getElementById('question-count-select');
  const selectedQuestionCount = parseInt(questionCountSelect.value, 10);

  // MAX_QUESTIONSを60に固定
  const MAX_QUESTIONS = 60;

  if (isNaN(selectedQuestionCount) || selectedQuestionCount < 1 || selectedQuestionCount > MAX_QUESTIONS) {
    alert(`問題数は1から${MAX_QUESTIONS}の間で選択してください。`);
    return;
  }
  
  // allQuestionsから新しい配列を作成してシャッフル (utils.jsのshuffleArrayを使用)
  let shuffledQuestions = shuffleArray([...allQuestions]);
  
  // 選択された問題数までスライス。allQuestionsの数を超えないようにMath.minを使用
  questions = shuffledQuestions.slice(0, Math.min(selectedQuestionCount, allQuestions.length));
  
  currentQuestionIndex = 0;
  userAnswers = new Array(questions.length).fill(null); // 回答をnullで初期化

  // タイマーのリセットと開始
  clearInterval(timerId);
  timeLeft = QUIZ_TIME_LIMIT;
  updateTimerDisplay();
  timerId = setInterval(countdown, 1000);

  displayQuestion(questions[currentQuestionIndex]);
  updateNavigationButtons();
  showScreen('quiz-container'); // main.jsのshowScreenを使用
}

/**
 * タイマーのカウントダウン
 */
function countdown() {
  timeLeft--;
  updateTimerDisplay();
  if (timeLeft <= 0) {
    clearInterval(timerId);
    showResults(); // 時間切れで結果画面へ
  }
}

/**
 * タイマー表示の更新
 */
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('timer').textContent = `残り時間: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 問題を表示する
 * @param {Object} question - 表示する問題オブジェクト
 */
function displayQuestion(question) {
  document.getElementById('question-text').textContent = question.Quiz;
  const choicesDiv = document.getElementById('choices');
  const choicesList = document.createElement('ul');

  question.Choice.forEach((choiceText, index) => {
    const listItem = document.createElement('li');
    const radioId = `choice-${currentQuestionIndex}-${index}`; 

    const match = choiceText.match(/^(\d+)\s(.*)$/);
    const choiceNumber = match ? match[1] : (index + 1).toString();
    const actualChoiceText = match ? match[2] : choiceText;

    listItem.innerHTML = `
      <span>${choiceNumber}</span>
      <input type="radio" id="${radioId}" name="choice" value="${choiceNumber}">
      <label for="${radioId}">${actualChoiceText}</label>
    `;
    
    const radioInput = listItem.querySelector(`#${radioId}`);
    radioInput.addEventListener('change', () => {
        selectChoice(parseInt(choiceNumber, 10));
    });

    choicesList.appendChild(listItem);
  });

  choicesDiv.innerHTML = '';
  choicesDiv.appendChild(choicesList);

  const userAnswer = userAnswers[currentQuestionIndex];
  if (userAnswer !== null) {
    const selectedRadio = choicesDiv.querySelector(`input[name="choice"][value="${userAnswer}"]`);
    if (selectedRadio) {
      selectedRadio.checked = true;
      selectedRadio.closest('li').classList.add('selected');
    }
  }
}

/**
 * 選択肢選択時の処理
 * @param {number} choiceNumber - 選択された選択肢の番号
 */
function selectChoice(choiceNumber) {
  document.querySelectorAll('#choices li').forEach(li => {
    li.classList.remove('selected');
  });

  const selectedRadio = document.querySelector(`#choices input[name="choice"][value="${choiceNumber}"]`);
  if (selectedRadio) {
    selectedRadio.closest('li').classList.add('selected');
  }

  userAnswers[currentQuestionIndex] = choiceNumber;
}

/**
 * 前の問題へ移動する
 */
function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    displayQuestion(questions[currentQuestionIndex]);
    updateNavigationButtons();
  }
}

/**
 * 次の問題へ移動する、または結果を表示する
 */
function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion(questions[currentQuestionIndex]);
    updateNavigationButtons();
  } else {
    clearInterval(timerId); // タイマー停止
    showResults(); // results.jsのshowResultsを使用
  }
}

/**
 * ナビゲーションボタン（前へ、次へ/結果を見る）の表示を更新する
 */
function updateNavigationButtons() {
  document.getElementById('prev-button').disabled = currentQuestionIndex === 0;
  document.getElementById('next-button').textContent = currentQuestionIndex === questions.length - 1 ? '結果を見る' : '次へ';
}

/**
 * クイズ結果を表示する
 */
function showResults() {
  showScreen('results'); // main.jsのshowScreenを使用

  const resultsSummary = document.getElementById('results-summary');
  const resultsDetails = document.getElementById('results-details');

  let correctCount = 0;
  resultsDetails.innerHTML = '';

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = (userAnswer !== null && userAnswer.toString() === question.Answer); 

    if (isCorrect) {
      correctCount++;
    }

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
    resultsDetails.appendChild(questionResultDiv);
  });

  resultsSummary.innerHTML = `
    <p>正解数: ${correctCount} / ${questions.length}</p>
    <p>正答率: ${((correctCount / questions.length) * 100).toFixed(1)}%</p>
  `;

  // 過去の結果を保存 (pastResults.jsのsaveResultを使用)
  saveResult({
    date: new Date().toLocaleString(),
    correct: correctCount,
    total: questions.length,
    userAnswers: userAnswers,
    questions: questions.map(q => ({
      id: q.id,
      Quiz: q.Quiz,
      Choice: q.Choice,
      Answer: q.Answer,
      Description: q.Description,
      chapter: q.chapter,
      section: q.section,
      subsection: q.subsection,
      learningItem: q.learningItem
    }))
  });
}