// app.js

// クイズ機能の変数
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
// const MAX_QUESTIONS; // ここを削除
const QUIZ_TIME_LIMIT = 60 * 60;
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
  // 選択された問題数を取得
  const questionCountSelect = document.getElementById('question-count-select');
  const selectedQuestionCount = parseInt(questionCountSelect.value, 10);

  if (isNaN(selectedQuestionCount) || selectedQuestionCount < 1 || selectedQuestionCount > 60) {
    alert("問題数は1問から60問の間で選択してください。");
    return;
  }

  showScreen('quiz-container');
  
  // 選択された問題数でシャッフルしてスライス
  questions = shuffleArray([...allQuestions]).slice(0, selectedQuestionCount);
  currentQuestionIndex = 0;
  userAnswers = new Array(questions.length).fill(null);

  timeLeft = QUIZ_TIME_LIMIT;
  startTimer();
  loadQuestion();
}

// クイズからメニューに戻る
function backToMenuFromQuiz() {
  if (confirm('問題を中断して最初の画面に戻りますか？')) {
    clearInterval(timerId);
    showScreen('menu');
  }
}

// タイマー開始
function startTimer() {
  updateTimerDisplay();
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerId);
      alert("制限時間が終了しました。自動的に結果画面に移ります。");
      submitQuiz();
    }
    updateTimerDisplay();
  }, 1000);
}

// タイマー表示更新
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById("timer").textContent = `残り時間: ${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}

// 問題を読み込む
function loadQuestion() {
  const question = questions[currentQuestionIndex];
  const questionText = document.getElementById("question-text");
  const choicesContainer = document.getElementById("choices");

  questionText.textContent = question.Quiz;
  choicesContainer.innerHTML = "";

  question.Choice.forEach((choice, index) => {
    const choiceId = `choice-${index}`;
    const label = document.createElement("label");
    label.setAttribute("for", choiceId);

    const numberSpan = document.createElement("span");
    numberSpan.classList.add("choice-number");
    numberSpan.textContent = index + 1;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "choice";
    radio.id = choiceId;
    radio.value = index + 1;

    if (userAnswers[currentQuestionIndex] === radio.value.toString()) {
      radio.checked = true;
    }

    const textSpan = document.createElement("span");
    textSpan.classList.add("choice-text");
    textSpan.textContent = choice.substring(2);

    label.appendChild(numberSpan);
    label.appendChild(radio);
    label.appendChild(textSpan);

    choicesContainer.appendChild(label);
  });

  document.getElementById("prev-button").disabled = currentQuestionIndex === 0;
  document.getElementById("next-button").style.display = currentQuestionIndex === questions.length - 1 ? "none" : "inline-block";
  document.getElementById("submit-button").style.display = currentQuestionIndex === questions.length - 1 ? "inline-block" : "none";
}

// 回答を保存
function saveAnswer() {
  const selected = document.querySelector('input[name="choice"]:checked');
  if (selected) {
    userAnswers[currentQuestionIndex] = selected.value;
  }
}

// 次の問題へ
function nextQuestion() {
  saveAnswer();
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    loadQuestion();
  }
}

// 前の問題へ
function prevQuestion() {
  saveAnswer();
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
  }
}

// クイズを送信
function submitQuiz() {
  saveAnswer();
  clearInterval(timerId);

  let correctCount = 0;
  const resultDetails = document.getElementById("result-details");
  resultDetails.innerHTML = "";

  questions.forEach((q, i) => {
    const userAns = userAnswers[i];
    const isCorrect = userAns === q.Answer;
    if (isCorrect) correctCount++;

    const div = document.createElement("div");
    div.classList.add("question-result");

    div.innerHTML = `
      <p><strong>問題${i + 1}:</strong> ${q.Quiz}</p>
      <p>あなたの答え: ${userAns || "未回答"}</p>
      <p>正解: ${q.Answer}</p>
      <p>${isCorrect ? "✅ 正解" : "❌ 不正解"}</p>
      <p>解説: ${q.Description}</p>
    `;

    resultDetails.appendChild(div);
  });

  const summary = document.createElement("p");
  summary.innerHTML = `<strong>正解数: ${correctCount} / ${questions.length}</strong>`;
  resultDetails.prepend(summary);

  savePastResult(correctCount, questions.length);
  showScreen('results');
}

// 過去の結果を保存
function savePastResult(correctCount, total) {
  const now = new Date();
  const record = {
    date: now.toISOString().slice(0,10),
    correct: correctCount,
    total: total
  };
  const pastResults = JSON.parse(localStorage.getItem("pastResults") || "[]");
  pastResults.push(record);
  localStorage.setItem("pastResults", JSON.stringify(pastResults));
}

// 過去の結果を表示
function showPastResults() {
  showScreen('past-results');
  const pastResultsDetails = document.getElementById("past-results-details");
  pastResultsDetails.innerHTML = "";

  const pastResults = JSON.parse(localStorage.getItem("pastResults") || "[]");
  if (pastResults.length === 0) {
    pastResultsDetails.textContent = "過去の結果はありません。";
    return;
  }

  let totalCorrect = 0;
  let totalQuestions = 0;
  pastResults.forEach(r => {
    totalCorrect += r.correct;
    totalQuestions += r.total;
  });
  const totalIncorrect = totalQuestions - totalCorrect;
  const correctRate = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(2) : 0;

  const summary = document.createElement("p");
  summary.innerHTML = `
    <strong>累計正解数:</strong> ${totalCorrect} <br>
    <strong>累計不正解数:</strong> ${totalIncorrect} <br>
    <strong>累計正答率:</strong> ${correctRate} %
  `;
  pastResultsDetails.appendChild(summary);

  const list = document.createElement("ul");
  pastResults.forEach((r, i) => {
    const li = document.createElement("li");
    li.textContent = `${r.date} - 正解: ${r.correct} / ${r.total}`;
    list.appendChild(li);
  });
  pastResultsDetails.appendChild(list);
}

// 過去の結果をリセット
function resetPastResults() {
  if (confirm('過去の結果を全て削除します。よろしいですか？')) {
    localStorage.removeItem("pastResults");
    showPastResults();
  }
}

// メニューに戻る（結果画面から）
function backToMenuFromResults() {
  showScreen('menu');
}

// メニューに戻る（過去結果画面から）
function backToMenuFromPastResults() {
  showScreen('menu');
}

// パンくずリストを更新する関数
function updateBreadcrumb() {
  const breadcrumbDiv = document.getElementById("breadcrumb");
  breadcrumbDiv.innerHTML = ""; // パンくずリストをクリア

  currentBreadcrumb.forEach((item, index) => {
    const span = document.createElement("span");
    if (index === currentBreadcrumb.length - 1) {
      // 現在の階層
      span.classList.add("current-level");
      span.textContent = item.name;
    } else {
      // 過去の階層
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = item.name;
      a.onclick = (e) => {
        e.preventDefault(); // リンクのデフォルト動作をキャンセル
        // クリックされた階層までパンくずリストを戻す
        currentBreadcrumb = currentBreadcrumb.slice(0, index + 1);
        item.func(...item.args); // 保存された関数とその引数を呼び出す
      };
      span.appendChild(a);
    }
    breadcrumbDiv.appendChild(span);
    if (index < currentBreadcrumb.length - 1) {
      const separator = document.createElement("span");
      separator.textContent = " > ";
      breadcrumbDiv.appendChild(separator);
    }
  });
}

// 問題一覧を表示
function showQuestionList() {
  resetQuestionListViews();
  showScreen('question-list');
  
  // パンくずリストを初期化
  currentBreadcrumb = [{ name: "問題一覧", func: showQuestionList, args: [] }];
  updateBreadcrumb();

  const chapterGrid = document.querySelector("#chapter-list .button-grid");
  chapterGrid.innerHTML = "";
  
  // 章の順序を定義
  const chapterOrder = {
    "第一章": 1,
    "第二章": 2,
    "第三章": 3,
    "第四章": 4,
    "第五章": 5
  };
  
  // 章ごとに分類
  const chapters = {};
  
  // 問題データから章・節を分類
  allQuestions.forEach(q => {
    // 章がまだ存在しない場合は作成
    if (!chapters[q.chapter]) {
      chapters[q.chapter] = {
        sections: {},
        title: q.chapter,
        order: chapterOrder[q.chapter] || 99
      };
    }
    
    // 大項目がまだ存在しない場合は作成
    if (!chapters[q.chapter].sections[q.section]) {
      chapters[q.chapter].sections[q.section] = {
        subsections: {},
        title: q.section
      };
    }
    
    // 中項目がまだ存在しない場合は作成
    if (!chapters[q.chapter].sections[q.section].subsections[q.subsection]) {
      chapters[q.chapter].sections[q.section].subsections[q.subsection] = {
        learningItems: {},
        title: q.subsection
      };
    }
    
    // 学習項目がまだ存在しない場合は作成
    if (!chapters[q.chapter].sections[q.section].subsections[q.subsection].learningItems[q.learningItem]) {
      chapters[q.chapter].sections[q.section].subsections[q.subsection].learningItems[q.learningItem] = {
        questions: [],
        title: q.learningItem
      };
    }
    
    // 問題を学習項目に追加
    chapters[q.chapter].sections[q.section].subsections[q.subsection].learningItems[q.learningItem].questions.push(q);
  });
  
  // 章ボタンを作成（順番通りに）
  Object.values(chapters)
    .sort((a, b) => a.order - b.order)
    .forEach(chapter => {
      const chapterBtn = document.createElement("button");
      chapterBtn.className = "menu-button";
      chapterBtn.textContent = chapter.title;
      chapterBtn.onclick = () => showSectionList(chapter);
      chapterGrid.appendChild(chapterBtn);
    });
}

// 章一覧に戻る
function backToChapterList() {
  currentBreadcrumb = currentBreadcrumb.slice(0, 1); // "問題一覧" まで戻す
  updateBreadcrumb();
  resetQuestionListViews();
  document.getElementById("chapter-list").style.display = "block";
}

// 大項目表示
function showSectionList(chapter) {
  resetQuestionListViews();
  const sectionList = document.getElementById("section-list");
  sectionList.style.display = "block";
  
  // パンくずリストを更新
  currentBreadcrumb = [{ name: "問題一覧", func: showQuestionList, args: [] }, { name: chapter.title, func: showSectionList, args: [chapter] }];
  updateBreadcrumb();

  const sectionGrid = sectionList.querySelector('.button-grid');
  sectionGrid.innerHTML = '';
  
  // 大項目ボタンを作成
  Object.keys(chapter.sections).forEach(sectionKey => {
    const section = chapter.sections[sectionKey];
    const sectionBtn = document.createElement("button");
    sectionBtn.className = "menu-button";
    sectionBtn.textContent = section.title;
    sectionBtn.onclick = () => showSubsectionList(section, chapter);
    sectionGrid.appendChild(sectionBtn);
  });
}

// 大項目一覧に戻る
function backToSectionList() {
  // パンくずリストの末尾から一つ削除して更新
  currentBreadcrumb.pop(); 
  updateBreadcrumb();
  resetQuestionListViews();
  document.getElementById("section-list").style.display = "block";
}

// 中項目表示
function showSubsectionList(section, chapter) {
  resetQuestionListViews();
  const subsectionList = document.getElementById("subsection-list");
  subsectionList.style.display = "block";
  
  // パンくずリストを更新
  currentBreadcrumb = [
    { name: "問題一覧", func: showQuestionList, args: [] },
    { name: chapter.title, func: showSectionList, args: [chapter] },
    { name: section.title, func: showSubsectionList, args: [section, chapter] }
  ];
  updateBreadcrumb();

  const subsectionGrid = subsectionList.querySelector('.button-grid');
  subsectionGrid.innerHTML = '';
  
  // 中項目ボタンを作成
  Object.keys(section.subsections).forEach(subsectionKey => {
    const subsection = section.subsections[subsectionKey];
    const subsectionBtn = document.createElement("button");
    subsectionBtn.className = "menu-button";
    subsectionBtn.textContent = subsection.title;
    subsectionBtn.onclick = () => showLearningItemList(subsection, section, chapter);
    subsectionGrid.appendChild(subsectionBtn);
  });
}

// 中項目一覧に戻る
function backToSubsectionList() {
  currentBreadcrumb.pop();
  updateBreadcrumb();
  resetQuestionListViews();
  document.getElementById("subsection-list").style.display = "block";
}

// 学習項目表示
function showLearningItemList(subsection, section, chapter) {
  resetQuestionListViews();
  const learningItemList = document.getElementById("learning-item-list");
  learningItemList.style.display = "block";
  
  // パンくずリストを更新
  currentBreadcrumb = [
    { name: "問題一覧", func: showQuestionList, args: [] },
    { name: chapter.title, func: showSectionList, args: [chapter] },
    { name: section.title, func: showSubsectionList, args: [section, chapter] },
    { name: subsection.title, func: showLearningItemList, args: [subsection, section, chapter] }
  ];
  updateBreadcrumb();

  const learningItemGrid = learningItemList.querySelector('.button-grid');
  learningItemGrid.innerHTML = '';
  
  // 学習項目ボタンを作成
  Object.keys(subsection.learningItems).forEach(learningItemKey => {
    const learningItem = subsection.learningItems[learningItemKey];
    const learningItemBtn = document.createElement("button");
    learningItemBtn.className = "menu-button";
    learningItemBtn.textContent = learningItem.title;
    learningItemBtn.onclick = () => showQuestionDetailList(learningItem, subsection, section, chapter);
    learningItemGrid.appendChild(learningItemBtn);
  });
}

// 学習項目一覧に戻る
function backToLearningItemList() {
  currentBreadcrumb.pop();
  updateBreadcrumb();
  resetQuestionListViews();
  document.getElementById("learning-item-list").style.display = "block";
}

// 問題一覧表示
function showQuestionDetailList(learningItem, subsection, section, chapter) {
  resetQuestionListViews();
  const questionDetailList = document.getElementById("question-detail-list");
  questionDetailList.style.display = "block";
  
  // パンくずリストを更新
  currentBreadcrumb = [
    { name: "問題一覧", func: showQuestionList, args: [] },
    { name: chapter.title, func: showSectionList, args: [chapter] },
    { name: section.title, func: showSubsectionList, args: [section, chapter] },
    { name: subsection.title, func: showLearningItemList, args: [subsection, section, chapter] },
    { name: learningItem.title, func: showQuestionDetailList, args: [learningItem, subsection, section, chapter] }
  ];
  updateBreadcrumb();

  const questionGrid = questionDetailList.querySelector('.button-grid');
  questionGrid.innerHTML = '';
  
  // 問題ボタンを作成（問題ID表示）
  learningItem.questions.forEach((question) => {
    const questionBtn = document.createElement("button");
    questionBtn.className = "menu-button";
    questionBtn.textContent = question.id;
    questionBtn.onclick = () => showQuestionDetail(question, learningItem, subsection, section, chapter);
    questionGrid.appendChild(questionBtn);
  });
}

// 問題一覧に戻る
function backToQuestionList() {
  currentBreadcrumb.pop();
  updateBreadcrumb();
  resetQuestionListViews();
  document.getElementById("question-detail-list").style.display = "block";
}

// 問題詳細表示
function showQuestionDetail(question, learningItem, subsection, section, chapter) {
  resetQuestionListViews();
  const questionDetail = document.getElementById("question-detail");
  questionDetail.style.display = "block";
  
  // パンくずリストを更新
  currentBreadcrumb = [
    { name: "問題一覧", func: showQuestionList, args: [] },
    { name: chapter.title, func: showSectionList, args: [chapter] },
    { name: section.title, func: showSubsectionList, args: [section, chapter] },
    { name: subsection.title, func: showLearningItemList, args: [subsection, section, chapter] },
    { name: learningItem.title, func: showQuestionDetailList, args: [learningItem, subsection, section, chapter] },
    { name: `問題ID: ${question.id}`, func: showQuestionDetail, args: [question, learningItem, subsection, section, chapter] }
  ];
  updateBreadcrumb();

  const detailContainer = questionDetail.querySelector('.question-detail-container');
  detailContainer.innerHTML = `
    <h3>問題詳細 (ID: ${question.id})</h3>
    <p><strong>章:</strong> ${question.chapter}</p>
    <p><strong>大項目:</strong> ${question.section}</p>
    <p><strong>中項目:</strong> ${question.subsection}</p>
    <p><strong>学習項目:</strong> ${question.learningItem}</p>
    <div class="question-text">
      <p><strong>問題:</strong> ${question.Quiz}</p>
    </div>
    <div class="choices">
      <strong>選択肢:</strong>
      <ul>
        ${question.Choice.map(choice => `<li>${choice}</li>`).join('')}
      </ul>
    </div>
    <div class="answer">
      <p><strong>正解:</strong> ${question.Answer}</p>
    </div>
    <div class="description">
      <p><strong>解説:</strong> ${question.Description}</p>
    </div>
  `;
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
  document.getElementById("chapter-list").style.display = "none";
  document.getElementById("section-list").style.display = "none";
  document.getElementById("subsection-list").style.display = "none";
  document.getElementById("learning-item-list").style.display = "none";
  document.getElementById("question-detail-list").style.display = "none";
  document.getElementById("question-detail").style.display = "none";
  
  // 章一覧を表示 (パンくずリストから戻る際に使用)
  document.getElementById("chapter-list").style.display = "block";
}

// 初期表示
window.onload = () => {
  showScreen('menu');

  // 問題数選択のドロップダウンを生成
  const questionCountSelect = document.getElementById('question-count-select');
  for (let i = 1; i <= 60; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${i}問`;
    if (i === 60) { // デフォルトで60問を選択
      option.selected = true;
    }
    questionCountSelect.appendChild(option);
  }
};
