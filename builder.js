// builder.js - Handles form logic and JSON export
let sectionCount = 0;

function addSection() {
  const container = document.getElementById('sections');
  const sectionId = `section-${sectionCount++}`;

  const html = `
    <div class="card" id="${sectionId}">
      <h2>Section</h2>
      <label>Title: <input class="section-title" /></label>
      <label>Passage:<br/><textarea rows="6" class="section-passage"></textarea></label>
      <div class="questions"></div>
      <button onclick="addQuestion('${sectionId}')">➕ Add Question</button>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);
}

function addQuestion(sectionId) {
  const questionsDiv = document.querySelector(`#${sectionId} .questions`);
  const qIndex = questionsDiv.children.length + 1;

  const html = `
    <div class="card">
      <label>Question ${qIndex}:</label>
      <textarea class="question-text" rows="2"></textarea>
      <label>Type:
        <select class="question-type">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="short-answer">Short Answer</option>
          <option value="true-false-not-given">True/False/Not Given</option>
          <option value="matching">Matching</option>
        </select>
      </label>
      <label>Options (A,B,C,D - comma separated, optional): <input class="question-options" /></label>
      <label>Answer(s): <input class="question-answer" placeholder="e.g. A or grants or TRUE" /></label>
    </div>
  `;

  questionsDiv.insertAdjacentHTML('beforeend', html);
}

function exportJSON() {
  const id = document.getElementById('test-id').value.trim();
  const title = document.getElementById('test-title').value.trim();
  const description = document.getElementById('test-description').value.trim();

  const sectionEls = document.querySelectorAll('#sections > .card');
  const sections = [];

  sectionEls.forEach(sectionEl => {
    const title = sectionEl.querySelector('.section-title').value.trim();
    const passage = sectionEl.querySelector('.section-passage').value.trim();
    const questionEls = sectionEl.querySelectorAll('.questions > .card');

    const questions = Array.from(questionEls).map((qEl, i) => {
      const question = qEl.querySelector('.question-text').value.trim();
      const type = qEl.querySelector('.question-type').value;
      const optionsRaw = qEl.querySelector('.question-options').value.trim();
      const options = optionsRaw ? optionsRaw.split(',').map(s => s.trim()) : [];
      let answer = qEl.querySelector('.question-answer').value.trim();
      if (answer.includes(',') && type === 'short-answer') {
        answer = answer.split(',').map(s => s.trim());
      }
      return {
        number: i + 1,
        type,
        question,
        ...(options.length > 0 ? { options } : {}),
        answer
      };
    });

    sections.push({ title, passage, questions });
  });

  const json = {
    id,
    title,
    description,
    sections
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${id || 'ielts-test'}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
