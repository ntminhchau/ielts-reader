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
  const manifest = await fetch('./tests/test_manifest.json').then(res => res.json());

  container.innerHTML = '';
  for (const test of manifest) {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML = `
      <h2>${test.title}</h2>
      <p>${test.description}</p>
      <button onclick="startTest('${test.file}', 'test')">Start Timed</button>
      <button onclick="startTest('${test.file}', 'practice')">Start Practice</button>
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
document.getElementById('submit-btn').onclick = () => {
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    window.location.href = 'review.html';
  };
}

function renderPassageAndQuestions(test) {
  const passagePane = document.getElementById('passage-pane');
  const questionsPane = document.getElementById('questions-pane');
  const nav = document.getElementById('navigation-controls');

  test.sections.forEach((section, i) => {
    passagePane.innerHTML += `<h2>${section.title}</h2><p>${section.passage}</p>`;

    section.questions.forEach(q => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question-card';
      qDiv.innerHTML = `
        <p><strong>Q${q.number}</strong>: ${q.question}</p>
        ${q.options.map(opt => `
          <label><input type="radio" name="q${q.number}" value="${opt}" 
            onchange="userAnswers[${q.number}] = '${opt}'" /> ${opt}</label><br/>`
        ).join('')}
      `;
      questionsPane.appendChild(qDiv);
    });
  });
}

function startTimer(seconds) {
  const container = document.getElementById('timer-container');
  timer = setInterval(() => {
    if (seconds <= 0) {
      clearInterval(timer);
      alert("Time's up!");
      document.getElementById('submit-btn').click();
    } else {
      container.textContent = `Time Left: ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
      seconds--;
    }
  }, 1000);
}

// ----------------- REVIEW PAGE -----------------
async function showReview() {
  const file = localStorage.getItem('currentTestFile');
  const test = await fetch(testFolder + file).then(res => res.json());
  const answers = JSON.parse(localStorage.getItem('userAnswers'));
  const bandMap = await fetch(bandMapUrl).then(res => res.json());
  const reviewDiv = document.getElementById('review-container');

  let totalCorrect = 0;
  reviewDiv.innerHTML = '';

  test.sections.forEach(section => {
    section.questions.forEach(q => {
      const userAnswer = answers[q.number];
      const isCorrect = userAnswer === q.answer;
      if (isCorrect) totalCorrect++;
      const div = document.createElement('div');
      div.className = `question-card ${isCorrect ? 'correct-answer' : 'incorrect-answer'}`;
      div.innerHTML = `
        <p><strong>Q${q.number}:</strong> ${q.question}</p>
        <p>Your answer: <strong>${userAnswer || 'N/A'}</strong></p>
        ${!isCorrect ? `<p>Correct answer: <strong>${q.answer}</strong></p>` : ''}
      `;
      reviewDiv.appendChild(div);
    });
  });

  const bandScore = bandMap[totalCorrect] || 'N/A';
  const summary = document.createElement('div');
  summary.innerHTML = `<h2>Score Summary</h2>
    <p>Total Correct: ${totalCorrect}</p>
    <p>Estimated IELTS Band: <strong>${bandScore}</strong></p>`;
  reviewDiv.prepend(summary);

  document.getElementById('retake-btn').onclick = () => {
    localStorage.removeItem('userAnswers');
    window.location.href = 'test.html';
  };
}
