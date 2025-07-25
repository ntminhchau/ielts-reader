// app.js: Handles test loading, timing, navigation, result generation

const testFolder = 'tests/';
const bandMapUrl = 'data/band_conversion.json';

let currentTest = null;
let userAnswers = {};
let mode = 'practice'; // 'test' or 'practice'
let timer = null;

// ----------------- ON LOAD -----------------
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.toLowerCase();

  if (path.endsWith('/') || path.endsWith('/index.html')) {
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

  try {
    const res = await fetch('./tests/test_manifest.json');
    const manifest = await res.json();
    console.log("✅ Manifest loaded:", manifest);

    if (!manifest.length) {
      container.innerHTML = '<p>No tests found in manifest.</p>';
      return;
    }

    container.innerHTML = '';
    manifest.forEach(test => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.innerHTML = `
        <h2>${test.title}</h2>
        <p>${test.description}</p>
        <button onclick="startTest('${test.file}', 'test')">Start Timed</button>
        <button onclick="startTest('${test.file}', 'practice')">Start Practice</button>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("❌ Error loading tests:", err);
    container.innerHTML = '<p>Error loading tests. Please try again later.</p>';
  }
}

// Expose startTest globally so it works with onclick in HTML
window.startTest = function (filename, selectedMode) {
  localStorage.setItem('currentTestFile', filename);
  localStorage.setItem('mode', selectedMode);
  window.location.href = 'test.html';
};

// ----------------- TEST PAGE -----------------
async function initTestPage() {
  const file = localStorage.getItem('currentTestFile');
  mode = localStorage.getItem('mode');

  try {
    const res = await fetch(testFolder + file);
    currentTest = await res.json();
  } catch (err) {
    console.error("❌ Failed to load test file:", err);
    return;
  }

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

  test.sections.forEach(section => {
    // Section title
    const sectionHeader = document.createElement('h2');
    sectionHeader.textContent = section.title;
    passagePane.appendChild(sectionHeader);

    // Paragraph formatting (from newlines)
    section.passage.split('\n').forEach(para => {
      const p = document.createElement('p');
      p.textContent = para.trim();
      passagePane.appendChild(p);
    });

    // Render questions
    section.questions.forEach(q => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question-card';

      const qLabel = document.createElement('p');
      qLabel.innerHTML = `<strong>Q${q.number}:</strong> ${q.question}`;
      qDiv.appendChild(qLabel);

      if (q.options && Array.isArray(q.options)) {
        // Multiple choice / Matching
        q.options.forEach(opt => {
          const label = document.createElement('label');
          label.innerHTML = `
            <input type="radio" name="q${q.number}" value="${opt}" />
            ${opt}
          `;
          label.querySelector('input').addEventListener('change', () => {
            userAnswers[q.number] = opt;
          });
          qDiv.appendChild(label);
          qDiv.appendChild(document.createElement('br'));
        });
      } else if (q.type === 'true-false-not-given') {
        // TFNG options hardcoded
        ['TRUE', 'FALSE', 'NOT GIVEN'].forEach(opt => {
          const label = document.createElement('label');
          label.innerHTML = `
            <input type="radio" name="q${q.number}" value="${opt}" />
            ${opt}
          `;
          label.querySelector('input').addEventListener('change', () => {
            userAnswers[q.number] = opt;
          });
          qDiv.appendChild(label);
          qDiv.appendChild(document.createElement('br'));
        });
      } else {
        // Short answer input
        const input = document.createElement('input');
        input.type = 'text';
        input.name = `q${q.number}`;
        input.placeholder =
          q.type === 'short-answer'
            ? 'Answer with up to 3 words and/or a number'
            : 'Type your answer';
        input.addEventListener('input', () => {
          userAnswers[q.number] = input.value.trim();
        });
        qDiv.appendChild(input);
      }

      questionsPane.appendChild(qDiv);
    });
  });
}


function startTimer(seconds) {
  const container = document.getElementById('timer-container');
  timer = setInterval(() => {
    if (seconds <= 0) {
      clearInterval(timer);
      alert("⏰ Time's up!");
      document.getElementById('submit-btn').click();
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = (seconds % 60).toString().padStart(2, '0');
      container.textContent = `Time Left: ${mins}:${secs}`;
      seconds--;
    }
  }, 1000);
}

// ----------------- REVIEW PAGE -----------------
async function showReview() {
  const file = localStorage.getItem('currentTestFile');
  const answers = JSON.parse(localStorage.getItem('userAnswers'));
  const reviewDiv = document.getElementById('review-container');

  let test = null, bandMap = null;
  try {
    test = await fetch(testFolder + file).then(res => res.json());
    bandMap = await fetch(bandMapUrl).then(res => res.json());
  } catch (err) {
    console.error("❌ Failed to load review data:", err);
    reviewDiv.innerHTML = '<p>Error loading review. Please try again.</p>';
    return;
  }

  let totalCorrect = 0;
  reviewDiv.innerHTML = '';

  test.sections.forEach(section => {
    const sectionHeader = document.createElement('h2');
    sectionHeader.textContent = section.title;
    reviewDiv.appendChild(sectionHeader);

    section.questions.forEach(q => {
      const userAnswer = (answers[q.number] || '').trim();
      const correctAnswer = q.answer;
      const isCorrect = userAnswer.toUpperCase() === correctAnswer.toUpperCase();

      if (isCorrect) totalCorrect++;

      const card = document.createElement('div');
      card.className = `question-card ${isCorrect ? 'correct-answer' : 'incorrect-answer'}`;

      card.innerHTML = `
        <p><strong>Q${q.number}:</strong> ${q.question}</p>
        <p><strong>Your answer:</strong> ${userAnswer || '<em>No answer</em>'}</p>
        ${!isCorrect ? `<p><strong>Correct answer:</strong> ${correctAnswer}</p>` : ''}
        <p><strong>Type:</strong> ${formatQuestionType(q.type)}</p>
      `;

      reviewDiv.appendChild(card);
    });
  });

  const bandScore = bandMap[totalCorrect] || 'N/A';
  const summary = document.createElement('div');
  summary.className = 'question-card';
  summary.innerHTML = `<h2>Score Summary</h2>
    <p>Total Correct: ${totalCorrect}</p>
    <p>Estimated IELTS Band: <strong>${bandScore}</strong></p>`;
  reviewDiv.prepend(summary);

  document.getElementById('retake-btn').onclick = () => {
    localStorage.removeItem('userAnswers');
    window.location.href = 'test.html';
  };
}

// Helper to format question type labels
function formatQuestionType(type) {
  switch ((type || '').toLowerCase()) {
    case 'true-false-not-given': return 'True / False / Not Given';
    case 'matching': return 'Matching';
    case 'multiple-choice': return 'Multiple Choice';
    case 'short-answer': return 'Short Answer';
    default: return 'Short Answer';
  }
}
