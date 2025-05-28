// app.js

// クイズ機能の変数
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
const QUIZ_TIME_LIMIT = 60 * 60; // 60分
let timerId = null;
let timeLeft = QUIZ_TIME_LIMIT;

// パンくずリスト用の変数
let currentBreadcrumb = [];

// 共通の画面切り替え関数
function showScreen(screenId) {
  const screens = ['menu', 'quiz-container', 'results', 'past-results', 'question-list'];
  screens.forEach(id => {
    document.getElementById(id).style.display = id === screenId ? 'block' : 'none';
  });
}

// 配列をシャッフルする関数
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// クイズ開始
function startQuiz() {
  const questionCountSelect = document.getElementById('question-count-select');
  const selectedQuestionCount = parseInt(questionCountSelect.value, 10);

  if (isNaN(selectedQuestionCount) || selectedQuestionCount < 1 || selectedQuestionCount > allQuestions.length) {
    alert(`問題数は1から${allQuestions.length}の間で選択してください。`);
    return;
  }

  // allQuestionsから新しい配列を作成してシャッフル・スライス
  questions = shuffleArray([...allQuestions]).slice(0, selectedQuestionCount);
  currentQuestionIndex = 0;
  userAnswers = new Array(questions.length).fill(null); // 回答をnullで初期化

  // タイマーのリセットと開始
  clearInterval(timerId);
  timeLeft = QUIZ_TIME_LIMIT;
  updateTimerDisplay();
  timerId = setInterval(countdown, 1000);

  displayQuestion(questions[currentQuestionIndex]);
  updateNavigationButtons();
  showScreen('quiz-container');
}

// タイマーのカウントダウン
function countdown() {
  timeLeft--;
  updateTimerDisplay();
  if (timeLeft <= 0) {
    clearInterval(timerId);
    showResults(); // 時間切れで結果画面へ
  }
}

// タイマー表示の更新
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('timer').textContent = `残り時間: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 問題表示
function displayQuestion(question) {
  document.getElementById('question-text').textContent = question.Quiz;
  const choicesDiv = document.getElementById('choices');
  const choicesList = document.createElement('ul');

  question.Choice.forEach((choice, index) => {
    const listItem = document.createElement('li');
    const radioId = `choice-${index}`; // ユニークなIDを生成

    listItem.innerHTML = `
      <input type="radio" id="${radioId}" name="choice" value="${index + 1}">
      <label for="${radioId}">${choice}</label>
    `;
    
    const radioInput = listItem.querySelector(`#${radioId}`);
    radioInput.addEventListener('change', () => {
        selectChoice(index + 1); // 選択された選択肢の番号を渡す
    });

    choicesList.appendChild(listItem);
  });

  choicesDiv.innerHTML = '';
  choicesDiv.appendChild(choicesList);

  // ユーザーが以前に選択した回答がある場合はそれを復元
  const userAnswer = userAnswers[currentQuestionIndex];
  if (userAnswer !== null) { // nullチェックを厳密にする
    const selectedRadio = choicesDiv.querySelector(`input[name="choice"][value="${userAnswer}"]`);
    if (selectedRadio) {
      selectedRadio.checked = true;
      selectedRadio.closest('li').classList.add('selected');
    }
  }
}

// 選択肢選択時の処理
function selectChoice(choiceNumber) {
  // すべての選択肢から 'selected' クラスを削除
  document.querySelectorAll('#choices li').forEach(li => {
    li.classList.remove('selected');
  });

  // 選択されたラジオボタンの親要素に 'selected' クラスを追加
  // input[name="choice"][value="${choiceNumber}"]でラジオボタンを特定し、その親のliを取得
  const selectedRadio = document.querySelector(`#choices input[name="choice"][value="${choiceNumber}"]`);
  if (selectedRadio) {
    selectedRadio.closest('li').classList.add('selected');
  }

  // ユーザーの回答を保存
  userAnswers[currentQuestionIndex] = choiceNumber;
}


// 前の問題へ
function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    displayQuestion(questions[currentQuestionIndex]);
    updateNavigationButtons();
  }
}

// 次の問題へ、または結果表示
function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion(questions[currentQuestionIndex]);
    updateNavigationButtons();
  } else {
    // 最後の問題の場合は結果表示
    clearInterval(timerId); // タイマー停止
    showResults();
  }
}

// ナビゲーションボタンの更新
function updateNavigationButtons() {
  document.getElementById('prev-button').disabled = currentQuestionIndex === 0;
  document.getElementById('next-button').textContent = currentQuestionIndex === questions.length - 1 ? '結果を見る' : '次へ';
}

// 結果表示
function showResults() {
  showScreen('results'); // まず結果画面を表示

  const resultsSummary = document.getElementById('results-summary');
  const resultsDetails = document.getElementById('results-details');

  let correctCount = 0;
  resultsDetails.innerHTML = ''; // 詳細をクリア

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    // Answerが文字列型なので、userAnswerも文字列型に変換して比較
    const isCorrect = (userAnswer !== null && userAnswer.toString() === question.Answer); 

    if (isCorrect) {
      correctCount++;
    }

    const questionResultDiv = document.createElement('div');
    questionResultDiv.classList.add('question-result');

    questionResultDiv.innerHTML = `
      <h3>問 ${question.id}: ${question.Quiz}</h3>
      <ul>
        ${question.Choice.map((choice, i) => `
          <li class="${isCorrect && (i + 1).toString() === question.Answer ? 'correct-answer' : (userAnswer === (i + 1) && !isCorrect ? 'user-answer' : '')}">
            ${i + 1}. ${choice}
          </li>
        `).join('')}
      </ul>
      <p><strong>正解:</strong> ${question.Answer}. ${question.Choice[parseInt(question.Answer) - 1]}</p>
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

  // 過去の結果を保存
  saveResult({
    date: new Date().toLocaleString(),
    correct: correctCount,
    total: questions.length,
    userAnswers: userAnswers,
    questions: questions.map(q => ({ // 問題の詳細をコピーして保存
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

// クイズ画面からメニューに戻る
function backToMenuFromQuiz() {
  if (confirm('クイズを中断してメニューに戻りますか？')) {
    clearInterval(timerId); // タイマー停止
    showScreen('menu');
  }
}

// 結果画面からメニューに戻る
function backToMenuFromResult() {
  showScreen('menu');
}

// 過去の結果を見る画面を表示
function showPastResults() {
  showScreen('past-results');
  const pastResultsListDiv = document.getElementById('past-results-list');
  const pastResultsDetailsDiv = document.getElementById('past-results-details');
  pastResultsListDiv.innerHTML = '<h3>過去のクイズ結果</h3><ul></ul>';
  pastResultsDetailsDiv.innerHTML = ''; // 詳細表示をクリア

  const results = loadResults();
  const ul = pastResultsListDiv.querySelector('ul');

  if (results.length === 0) {
    ul.innerHTML = '<li>過去の結果はありません。</li>';
  } else {
    // 最新の結果が上に来るように逆順で表示
    results.slice().reverse().forEach((result, index) => {
      // 実際のインデックスは reverse() される前のものになるため、再計算が必要
      const originalIndex = results.length - 1 - index;
      const li = document.createElement('li');
      li.textContent = `${result.date} - ${result.correct} / ${result.total} 問正解 (${((result.correct / result.total) * 100).toFixed(1)}%)`;
      li.dataset.index = originalIndex; // 元のインデックスを保持
      li.addEventListener('click', () => displayPastResultDetails(originalIndex));
      ul.appendChild(li);
    });
  }
}

// 過去の結果の詳細を表示
function displayPastResultDetails(index) {
  const results = loadResults();
  const result = results[index];
  const pastResultsDetailsDiv = document.getElementById('past-results-details');
  pastResultsDetailsDiv.innerHTML = `<h2>過去のクイズ結果詳細</h2>`;

  const backButton = document.createElement('button');
  backButton.classList.add('back-button');
  backButton.textContent = '結果一覧に戻る';
  backButton.onclick = showPastResults; // 結果一覧に戻る
  pastResultsDetailsDiv.appendChild(backButton);

  const summary = document.createElement('div');
  summary.classList.add('question-result'); // 結果表示と同じスタイルを流用
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
        ${question.Choice.map((choice, i) => `
          <li class="${isCorrect && (i + 1).toString() === question.Answer ? 'correct-answer' : (userAnswer === (i + 1) && !isCorrect ? 'user-answer' : '')}">
            ${i + 1}. ${choice}
          </li>
        `).join('')}
      </ul>
      <p><strong>正解:</strong> ${question.Answer}. ${question.Choice[parseInt(question.Answer) - 1]}</p>
      <div class="description">
        <p><strong>解説:</strong> ${question.Description}</p>
      </div>
    `;
    pastResultsDetailsDiv.appendChild(questionResultDiv);
  });
}


// ローカルストレージに結果を保存
function saveResult(result) {
  let results = loadResults();
  results.push(result);
  localStorage.setItem('quizResults', JSON.stringify(results));
}

// ローカルストレージから結果を読み込み
function loadResults() {
  const resultsString = localStorage.getItem('quizResults');
  return resultsString ? JSON.parse(resultsString) : [];
}

// 問題一覧を表示
function showQuestionList() {
  showScreen('question-list');
  renderChapterList(); // 章リストの表示
  updateBreadcrumb();
}

// パンくずリストの更新
function updateBreadcrumb() {
  const breadcrumbDiv = document.getElementById('breadcrumb');
  breadcrumbDiv.innerHTML = '';

  const homeSpan = document.createElement('span');
  homeSpan.textContent = 'メニュー';
  homeSpan.classList.add('home');
  homeSpan.onclick = () => {
    backToMenuFromQuestionList(); // メニューに戻る関数を呼び出す
  };
  breadcrumbDiv.appendChild(homeSpan);

  currentBreadcrumb.forEach((item, index) => {
    const separator = document.createElement('span');
    separator.textContent = ' > ';
    separator.classList.add('separator');
    breadcrumbDiv.appendChild(separator);

    const itemSpan = document.createElement('span');
    itemSpan.textContent = item.name;
    
    if (index === currentBreadcrumb.length - 1) {
      itemSpan.classList.add('current');
    } else {
      itemSpan.classList.add('clickable');
      itemSpan.onclick = () => {
        // クリックされた階層まで戻る
        currentBreadcrumb = currentBreadcrumb.slice(0, index + 1);
        updateBreadcrumb();
        
        // 適切なリストを表示
        if (item.type === 'chapter') {
          renderChapterList();
        } else if (item.type === 'section') {
          renderSectionList(item.chapter);
        } else if (item.type === 'subsection') {
          renderSubsectionList(item.chapter, item.section);
        } else if (item.type === 'learningItem') {
            renderLearningItemList(item.chapter, item.section, item.subsection);
        }
      };
    }
    breadcrumbDiv.appendChild(itemSpan);
  });
}

// 各リストの表示/非表示を切り替えるヘルパー関数
function showList(listId) {
  const lists = ["chapter-list", "section-list", "subsection-list", "learning-item-list", "question-detail-list", "question-detail"];
  lists.forEach(id => {
    document.getElementById(id).style.display = (id === listId) ? "block" : "none";
  });
}

// 章リストの表示
function renderChapterList() {
  showList('chapter-list');
  // 他のリストは非表示（念のため）
  document.getElementById('section-list').style.display = 'none';
  document.getElementById('subsection-list').style.display = 'none';
  document.getElementById('learning-item-list').style.display = 'none';
  document.getElementById('question-detail-list').style.display = 'none';
  document.getElementById('question-detail').style.display = 'none';


  const chapterGrid = document.getElementById('chapter-list').querySelector('.button-grid');
  chapterGrid.innerHTML = '';

  const chapters = [...new Set(allQuestions.map(q => q.chapter))].sort((a, b) => {
    // "第一章"と"第十章"を数値で比較できるように変換してソート
    const numA = parseInt(a.replace(/[^0-9]/g, ''));
    const numB = parseInt(b.replace(/[^0-9]/g, ''));
    return numA - numB;
  });

  chapters.forEach(chapter => {
    const button = document.createElement('button');
    button.classList.add('menu-button'); // menu-buttonスタイルを再利用
    button.textContent = chapter;
    button.onclick = () => {
      currentBreadcrumb = [{ type: 'chapter', name: chapter, chapter: chapter }];
      updateBreadcrumb();
      renderSectionList(chapter);
    };
    chapterGrid.appendChild(button);
  });
}

// 大項目リストの表示
function renderSectionList(chapter) {
  showList('section-list');
  const sectionGrid = document.getElementById('section-list').querySelector('.button-grid');
  sectionGrid.innerHTML = '';

  const sections = [...new Set(allQuestions.filter(q => q.chapter === chapter).map(q => q.section))];
  sections.forEach(section => {
    const button = document.createElement('button');
    button.classList.add('menu-button');
    button.textContent = section;
    button.onclick = () => {
      currentBreadcrumb.push({ type: 'section', name: section, chapter: chapter, section: section });
      updateBreadcrumb();
      renderSubsectionList(chapter, section);
    };
    sectionGrid.appendChild(button);
  });
}

// 中項目リストの表示
function renderSubsectionList(chapter, section) {
  showList('subsection-list');
  const subsectionGrid = document.getElementById('subsection-list').querySelector('.button-grid');
  subsectionGrid.innerHTML = '';

  const subsections = [...new Set(allQuestions.filter(q => q.chapter === chapter && q.section === section).map(q => q.subsection))];
  subsections.forEach(subsection => {
    const button = document.createElement('button');
    button.classList.add('menu-button');
    button.textContent = subsection;
    button.onclick = () => {
      currentBreadcrumb.push({ type: 'subsection', name: subsection, chapter: chapter, section: section, subsection: subsection });
      updateBreadcrumb();
      renderLearningItemList(chapter, section, subsection);
    };
    subsectionGrid.appendChild(button);
  });
}

// 学習項目リストの表示
function renderLearningItemList(chapter, section, subsection) {
    showList('learning-item-list');
    const learningItemGrid = document.getElementById('learning-item-list').querySelector('.button-grid');
    learningItemGrid.innerHTML = '';

    const learningItems = [...new Set(allQuestions.filter(q => 
        q.chapter === chapter && q.section === section && q.subsection === subsection
    ).map(q => q.learningItem))];

    learningItems.forEach(item => {
        const button = document.createElement('button');
        button.classList.add('menu-button');
        button.textContent = item;
        button.onclick = () => {
            currentBreadcrumb.push({ type: 'learningItem', name: item, chapter: chapter, section: section, subsection: subsection, learningItem: item });
            updateBreadcrumb();
            renderQuestionDetailList(chapter, section, subsection, item);
        };
        learningItemGrid.appendChild(button);
    });
}

// 問題詳細リストの表示
function renderQuestionDetailList(chapter, section, subsection, learningItem) {
    showList('question-detail-list');
    const questionDetailGrid = document.getElementById('question-detail-list').querySelector('.button-grid');
    questionDetailGrid.innerHTML = '';

    const filteredQuestions = allQuestions.filter(q =>
        q.chapter === chapter && q.section === section && q.subsection === subsection && q.learningItem === learningItem
    ).sort((a, b) => parseInt(a.id) - parseInt(b.id)); // IDでソート

    filteredQuestions.forEach(question => {
        const button = document.createElement('button');
        button.classList.add('menu-button'); // スタイルを再利用
        button.textContent = `問 ${question.id}`;
        button.onclick = () => {
            currentBreadcrumb.push({ 
                type: 'question', 
                name: `問 ${question.id}`, 
                id: question.id,
                chapter: chapter, // パンくずリストからの戻る処理のために追加
                section: section,
                subsection: subsection,
                learningItem: learningItem
            });
            updateBreadcrumb();
            displayQuestionDetail(question.id);
        };
        questionDetailGrid.appendChild(button);
    });
}

// 問題詳細の表示
function displayQuestionDetail(questionId) {
  showList('question-detail');
  const questionDetailDiv = document.getElementById('question-detail');
  const question = allQuestions.find(q => q.id === questionId);

  if (!question) {
    questionDetailDiv.innerHTML = '<p>問題が見つかりませんでした。</p>';
    return;
  }

  questionDetailDiv.innerHTML = `
    <button class="back-button" onclick="backToQuestionDetailList()">問題一覧に戻る</button>
    <div class="question-detail-container">
      <h3>問 ${question.id}: ${question.Quiz}</h3>
      <ul>
        ${question.Choice.map((choice, index) => `
          <li>
            <input type="radio" id="detail-choice-${question.id}-${index}" name="detail-choice-${question.id}" value="${index + 1}" disabled>
            <label for="detail-choice-${question.id}-${index}">${choice}</label>
          </li>
        `).join('')}
      </ul>
      <div class="answer">
        <p><strong>正解:</strong> ${question.Answer}. ${question.Choice[parseInt(question.Answer) - 1]}</p>
      </div>
      <div class="description">
        <p><strong>解説:</strong> ${question.Description}</p>
      </div>
    </div>
  `;
}

// パンくずリストからの戻る処理 (各階層)
function backToChapterList() {
  currentBreadcrumb = []; // パンくずリストをクリアしてメニューに戻る
  updateBreadcrumb();
  renderChapterList(); // 章リストを再描画
}

function backToSectionList() {
  currentBreadcrumb.pop(); // 現在の項目を削除
  updateBreadcrumb();
  const lastCrumb = currentBreadcrumb[currentBreadcrumb.length - 1];
  renderSectionList(lastCrumb.chapter);
}

function backToSubsectionList() {
  currentBreadcrumb.pop(); // 現在の項目を削除
  updateBreadcrumb();
  const lastCrumb = currentBreadcrumb[currentBreadcrumb.length - 1];
  renderSubsectionList(lastCrumb.chapter, lastCrumb.section);
}

function backToLearningItemList() {
  currentBreadcrumb.pop(); // 現在の項目を削除
  updateBreadcrumb();
  const lastCrumb = currentBreadcrumb[currentBreadcrumb.length - 1];
  renderLearningItemList(lastCrumb.chapter, lastCrumb.section, lastCrumb.subsection);
}

function backToQuestionDetailList() {
  currentBreadcrumb.pop(); // 現在の項目を削除
  updateBreadcrumb();
  const lastCrumb = currentBreadcrumb[currentBreadcrumb.length - 1];
  renderQuestionDetailList(lastCrumb.chapter, lastCrumb.section, lastCrumb.subsection, lastCrumb.learningItem);
}


// 問題一覧からメニューに戻る
function backToMenuFromQuestionList() {
  resetQuestionListViews();
  currentBreadcrumb = []; // パンくずリストをクリア
  updateBreadcrumb();
  showScreen('menu');
}

// 問題一覧画面のリセット
function resetQuestionListViews() {
  // すべてのリストコンテナを非表示にする
  document.getElementById("chapter-list").style.display = "none";
  document.getElementById("section-list").style.display = "none";
  document.getElementById("subsection-list").style.display = "none";
  document.getElementById("learning-item-list").style.display = "none";
  document.getElementById("question-detail-list").style.display = "none";
  document.getElementById("question-detail").style.display = "none";
  // resetQuestionListViewsは画面を非表示にするだけで、初期表示はshowQuestionListで行う
}

// 初期表示
window.onload = () => {
  showScreen('menu');

  // 問題数選択のドロップダウンを生成
  const questionCountSelect = document.getElementById('question-count-select');
  // 既存のオプションをクリア
  questionCountSelect.innerHTML = ''; 
  for (let i = 1; i <= allQuestions.length; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${i}問`;
    questionCountSelect.appendChild(option);
  }
  // デフォルトで20問を選択
  questionCountSelect.value = 20; 
};
