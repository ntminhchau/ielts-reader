let currentTest = null;
let timerInterval;
let timeLeft = 30 * 60;

function loadTest() {
  const url = document.getElementById("testSelector").value;
  const enableTimer = document.getElementById("enableTimer").checked;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      currentTest = data;
      renderTest(data);
      if (enableTimer) startTimer();
    });
}

function renderTest(test) {
  const container = document.getElementById("testContainer");
  container.innerHTML = `<h2>${test.title}</h2>`;
  
  test.sections.forEach((section) => {
    const sec = document.createElement("div");
    sec.innerHTML = `<h3>${section.title}</h3><p>${section.text}</p>`;
    section.questions.forEach(q => {
      const div = document.createElement("div");
      div.innerHTML = `
        <label>${q.question}</label><br>
        <input type="text" id="q${q.number}" data-answer='${JSON.stringify(q.answer)}'>
      `;
      sec.appendChild(div);
    });
    container.appendChild(sec);
  });

  document.getElementById("submitBtn").style.display = "inline-block";
  document.getElementById("scoreBox").innerHTML = "";
}

function checkAnswers() {
  let correct = 0;
  let total = 0;
  const results = [];

  currentTest.sections.forEach(section => {
    section.questions.forEach(q => {
      const input = document.getElementById(`q${q.number}`);
      const userAnswer = input.value.trim().toLowerCase();
      const correctAnswers = JSON.parse(input.dataset.answer).map(a => a.toLowerCase());

      total += 1;
      const isCorrect = correctAnswers.includes(userAnswer);
      if (isCorrect) {
        correct += 1;
        input.className = "correct";
      } else {
        input.className = "incorrect";
        input.value += ` ← Correct: ${correctAnswers[0]}`;
      }
      results.push({ number: q.number, userAnswer, correctAnswers, isCorrect });
    });
  });

  const band = estimateBand(correct, total);
  document.getElementById("scoreBox").innerHTML =
    `<h3>Your score: ${correct}/${total} | Band ${band}</h3>`;

  localStorage.setItem("ielts_results", JSON.stringify(results));
  showReview(results);
  clearInterval(timerInterval);
}

function estimateBand(score, total) {
  const pct = score / total;
  if (pct >= 0.9) return 9;
  if (pct >= 0.85) return 8;
  if (pct >= 0.75) return 7;
  if (pct >= 0.6) return 6;
  if (pct >= 0.5) return 5;
  return 4;
}

function startTimer() {
  const timerBox = document.getElementById("timerBox");
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      checkAnswers();
    } else {
      let minutes = Math.floor(timeLeft / 60);
      let seconds = timeLeft % 60;
      timerBox.innerHTML = `<h3>Time Left: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}</h3>`;
      timeLeft--;
    }
  }, 1000);
}

function showReview(results) {
  const reviewContainer = document.getElementById("reviewContainer");
  reviewContainer.innerHTML = "<h2>Review</h2>";
  results.forEach(r => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>Q${r.number}</strong>: Your answer: "${r.userAnswer}" – ${r.isCorrect ? "✅" : "❌ Correct: " + r.correctAnswers[0]}`;
    reviewContainer.appendChild(div);
  });
}