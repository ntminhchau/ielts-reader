// app.js: Handles test loading, timing, navigation, result generation
const testFolder = 'tests/';
const bandMapUrl = 'data/band_conversion.json';

let currentTest = null;
let userAnswers = {};
let mode = 'practice'; // 'test' or 'practice'
let timer = null;

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('index.html') || path === '/' || path === '/IELTS-Reading/') {
    loadTestList();
  } else if (path.includes('test.html')) {
    initTestPage();
  } else if (path.includes('review.html')) {
    showReview();
  }
});
// ----------------- HOMEPAGE -----------------
async function loadTestList() {
  const container = document.getElementById('test-list-container');
  const response = await fetch(testFolder);
  const text = await response.text();
  const parser = new DOMParser();
  const html = parser.parseFromString(text, 'text/html');
  const links = [...html.querySelectorAll('a')].filter(a => a.href.endsWith('.json'));

  container.innerHTML = '';
  for (const link of links) {
    const file = link.href.split('/').pop();
    const testData = await fetch(testFolder + file).then(res => res.json());
    const card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML = `
      <h2>${testData.title}</h2>
      <p>${testData.description}</p>
      <button onclick="startTest('${file}', 'test')">Start Timed</button>
      <button onclick="startTest('${file}', 'practice')">Start Practice</button>
    `;
    container.appendChild(card);
  }
}

function startTest(filename, selectedMode) {
  localStorage.setItem('currentTestFile', filename);
  localStorage.setItem('mode', selectedMode);
  window.location.href = 'test.html';
}

// ----------------- TEST PAGE -----------------
async function initTestPage() {
  const file = localStorage.getItem('currentTestFile');
  mode = localStorage.getItem('mode');
  currentTest = await fetch(testFolder + file).then(res => res.json());

  document.getElementById('test-title').textContent = currentTest.title;

  renderPassageAndQuestions(currentTest);

  if (mode === 'test') startTimer(60 * 60);
