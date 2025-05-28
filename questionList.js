// questionList.js

// パンくずリスト用の変数 (questionList.js内で管理)
let currentBreadcrumb = [];

/**
 * 問題一覧画面を表示する
 */
function showQuestionList() {
  showScreen('question-list'); // main.jsのshowScreenを使用
  currentBreadcrumb = []; // 問題一覧に遷移する際にパンくずリストをリセット
  updateBreadcrumb();
  renderChapterList(); // 章リストの表示
}

/**
 * パンくずリストを更新する
 */
function updateBreadcrumb() {
  const breadcrumbDiv = document.getElementById('breadcrumb');
  breadcrumbDiv.innerHTML = '';

  const homeSpan = document.createElement('span');
  homeSpan.textContent = 'メニュー';
  homeSpan.classList.add('home');
  homeSpan.onclick = () => {
    backToMenuFromQuestionList(); // main.jsの関数を呼び出す
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

/**
 * 各リストの表示/非表示を切り替えるヘルパー関数
 * @param {string} listId - 表示するリストコンテナのID
 */
function showList(listId) {
  const lists = ["chapter-list", "section-list", "subsection-list", "learning-item-list", "question-detail-list", "question-detail"];
  lists.forEach(id => {
    document.getElementById(id).style.display = (id === listId) ? "block" : "none";
  });
}

/**
 * 章リストを表示する
 */
function renderChapterList() {
  showList('chapter-list');
  const chapterGrid = document.getElementById('chapter-list').querySelector('.button-grid');
  chapterGrid.innerHTML = '';

  const chapters = [...new Set(allQuestions.map(q => q.chapter))].sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ''));
    const numB = parseInt(b.replace(/[^0-9]/g, ''));
    return numA - numB;
  });

  chapters.forEach(chapter => {
    const button = document.createElement('button');
    button.classList.add('menu-button');
    button.textContent = chapter;
    button.onclick = () => {
      currentBreadcrumb = [{ type: 'chapter', name: chapter, chapter: chapter }];
      updateBreadcrumb();
      renderSectionList(chapter);
    };
    chapterGrid.appendChild(button);
  });
}

/**
 * 大項目リストを表示する
 * @param {string} chapter - 選択された章
 */
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

/**
 * 中項目リストを表示する
 * @param {string} chapter - 選択された章
 * @param {string} section - 選択された大項目
 */
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

/**
 * 学習項目リストを表示する
 * @param {string} chapter - 選択された章
 * @param {string} section - 選択された大項目
 * @param {string} subsection - 選択された中項目
 */
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

/**
 * 問題詳細リストを表示する
 * @param {string} chapter - 選択された章
 * @param {string} section - 選択された大項目
 * @param {string} subsection - 選択された中項目
 * @param {string} learningItem - 選択された学習項目
 */
function renderQuestionDetailList(chapter, section, subsection, learningItem) {
    showList('question-detail-list');
    const questionDetailGrid = document.getElementById('question-detail-list').querySelector('.button-grid');
    questionDetailGrid.innerHTML = '';

    const filteredQuestions = allQuestions.filter(q =>
        q.chapter === chapter && q.section === section && q.subsection === subsection && q.learningItem === learningItem
    ).sort((a, b) => parseInt(a.id) - parseInt(b.id)); // IDでソート

    filteredQuestions.forEach(question => {
        const button = document.createElement('button');
        button.classList.add('menu-button');
        button.textContent = `問 ${question.id}`;
        button.onclick = () => {
            currentBreadcrumb.push({ 
                type: 'question', 
                name: `問 ${question.id}`, 
                id: question.id,
                chapter: chapter,
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

/**
 * 特定の問題の詳細を表示する
 * @param {string} questionId - 表示する問題のID
 */
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
        ${question.Choice.map((choiceText, index) => {
            const match = choiceText.match(/^(\d+)\s(.*)$/);
            const choiceNumber = match ? match[1] : (index + 1).toString();
            const actualChoiceText = match ? match[2] : choiceText;
            return `
              <li>
                <span>${choiceNumber}</span>
                <input type="radio" id="detail-choice-${question.id}-${index}" name="detail-choice-${question.id}" value="${choiceNumber}" disabled>
                <label for="detail-choice-${question.id}-${index}">${actualChoiceText}</label>
              </li>
            `;
        }).join('')}
      </ul>
      <div class="answer">
        <p><strong>正解:</strong> ${question.Answer}. ${question.Choice[parseInt(question.Answer) - 1].replace(/^\d+\s/, '')}</p>
      </div>
      <div class="description">
        <p><strong>解説:</strong> ${question.Description}</p>
      </div>
    </div>
  `;
}

// パンくずリストからの戻る処理 (各階層)
function backToChapterList() {
  currentBreadcrumb = []; // パンくずリストをクリアして章リストに戻る
  updateBreadcrumb();
  renderChapterList();
}

function backToSectionList() {
  currentBreadcrumb.pop();
  updateBreadcrumb();
  const lastCrumb = currentBreadcrumb[currentBreadcrumb.length - 1];
  renderSectionList(lastCrumb.chapter);
}

function backToSubsectionList() {
  currentBreadcrumb.pop();
  updateBreadcrumb();
  const lastCrumb = currentBreadcrumb[currentBreadcrumb.length - 1];
  renderSubsectionList(lastCrumb.chapter, lastCrumb.section);
}

function backToLearningItemList() {
  currentBreadcrumb.pop();
  updateBreadcrumb();
  const lastCrumb = currentBreadcrumb[currentBreadcrumb.length - 1];
  renderLearningItemList(lastCrumb.chapter, lastCrumb.section, lastCrumb.subsection);
}

function backToQuestionDetailList() {
  currentBreadcrumb.pop();
  updateBreadcrumb();
  const lastCrumb = currentBreadcrumb[currentBreadcrumb.length - 1];
  renderQuestionDetailList(lastCrumb.chapter, lastCrumb.section, lastCrumb.subsection, lastCrumb.learningItem);
}