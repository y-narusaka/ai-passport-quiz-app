// utils.js

/**
 * 配列をシャッフルする関数 (Fisher-Yatesアルゴリズム)
 * @param {Array} arr - シャッフルする配列
 * @returns {Array} シャッフルされた新しい配列
 */
function shuffleArray(arr) {
  // 元の配列を変更しないようにコピーを作成
  const newArr = [...arr]; 
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/**
 * 指定されたIDの画面を表示し、他の画面を非表示にする
 * @param {string} screenId - 表示する画面のID
 */
function showScreen(screenId) {
  const screens = ['menu', 'quiz-container', 'results', 'past-results', 'question-list'];
  screens.forEach(id => {
    document.getElementById(id).style.display = id === screenId ? 'block' : 'none';
  });
}