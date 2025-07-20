let timeLeft = 3600;  // 60 minutes
const timerElem = document.getElementById("timer");
const testPath = "tests/test1.json";

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  timerElem.textContent = `Time left: ${minutes}:${seconds}`;
  if (timeLeft > 0) {
    timeLeft--;
    setTimeout(updateTimer, 1000);
  } else {
    submitAnswers();
  }
}

async function loadTest() {
  const res = await fetch(testPath);
  const data = await res.json();
  document.getElementById("passage").textContent = data.passage;
  const form = document.getElementById("questionForm");

  data.questions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";
    div.dataset.index = i;
    div.dataset.type = q.type;
    div.dataset.answer = JSON.stringify(q.answer);
    div.innerHTML = `<p>${q.question}</p>`;

    if (q.type === "multiple_choice") {
      q.options.forEach(opt => {
        div.innerHTML += `<label><input type="radio" name="q${i}" value="${opt}"> ${opt}</label><br>`;
      });
    } else if (q.type === "true_false_not_given") {
      ["True", "False", "Not Given"].forEach(opt => {
        div.innerHTML += `<label><input type="radio" name="q${i}" value="${opt}"> ${opt}</label><br>`;
      });
    } else if (q.type === "fill_in_blank") {
      div.innerHTML += `<input name="q${i}" />`;
    } else if (q.type === "matching") {
      for (const key in q.pairs) {
        div.innerHTML += `<label>${key}: <input name="q${i}_${key}" /></label><br>`;
      }
    }

    form.appendChild(div);
  });
}

function submitAnswers() {
  const review = document.getElementById("review");
  review.innerHTML = "<h3>Review</h3>";
  const questions = document.querySelectorAll(".question");
  let correctCount = 0;

  questions.forEach((q, i) => {
    const type = q.dataset.type;
    const correct = JSON.parse(q.dataset.answer);
    let userAnswer = null;

    if (type === "multiple_choice" || type === "true_false_not_given") {
      const selected = q.querySelector("input[type=radio]:checked");
      if (selected) userAnswer = selected.value;
    } else if (type === "fill_in_blank") {
      const input = q.querySelector("input");
      userAnswer = input.value.trim();
    } else if (type === "matching") {
      userAnswer = {};
      for (const key in correct) {
        const input = q.querySelector(`input[name='q${i}_${key}']`);
        if (input) userAnswer[key] = input.value.trim();
      }
    }

    let isCorrect = false;
    if (type === "matching") {
      isCorrect = JSON.stringify(userAnswer).toLowerCase() === JSON.stringify(correct).toLowerCase();
    } else {
      isCorrect = userAnswer?.toLowerCase() === correct?.toLowerCase();
    }

    if (isCorrect) correctCount++;
    review.innerHTML += `<p>${q.querySelector("p").textContent}<br>
      Your answer: <span class="${isCorrect ? "correct" : "incorrect"}">${JSON.stringify(userAnswer)}</span><br>
      Correct answer: ${JSON.stringify(correct)}</p>`;
  });

  const band = convertScoreToBand(correctCount, questions.length);
  review.innerHTML += `<h4>Score: ${correctCount}/${questions.length} (Band ${band})</h4>`;

  localStorage.setItem("lastResult", JSON.stringify({ score: correctCount, total: questions.length, band }));
}

function convertScoreToBand(score, total) {
  const percentage = score / total;
  if (percentage >= 0.9) return 9;
  if (percentage >= 0.85) return 8.5;
  if (percentage >= 0.8) return 8;
  if (percentage >= 0.75) return 7.5;
  if (percentage >= 0.7) return 7;
  if (percentage >= 0.65) return 6.5;
  if (percentage >= 0.6) return 6;
  if (percentage >= 0.5) return 5;
  return 4;
}

updateTimer();
loadTest();