// builder.js - Handles form logic and JSON export
let sectionCount = 0;

function addSection() {
  const container = document.getElementById('sections');
  const sectionId = `section-${sectionCount++}`;

  const html = `
    <div class="card" id="${sectionId}">
      <h2>Section</h2>
      <label>Title: <input class="section-title" /></label>
      <label>Passage (use <b> and <i> tags for bold/italic):<br/><textarea rows="6" class="section-passage"></textarea></label>
      <div class="subgroups"></div>
      <button onclick="addSubgroup('${sectionId}')">➕ Add Question Group</button>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);
}

function addSubgroup(sectionId) {
  const subgroupContainer = document.querySelector(`#${sectionId} .subgroups`);
  const groupId = `${sectionId}-group-${Date.now()}`;
  const allQuestions = document.querySelectorAll('.questions > .card');
  const globalQuestionNumber = allQuestions.length + 1;

  const html = `
    <div class="card subgroup" id="${groupId}">
      <label>Group Instructions:<br/><textarea class="group-instructions" rows="2"></textarea></label>
      <div class="questions"></div>
      <button onclick="addQuestion('${groupId}')">➕ Add Question</button>
    </div>
  `;

  subgroupContainer.insertAdjacentHTML('beforeend', html);
}

function addQuestion(groupId) {
  const questionsDiv = document.querySelector(`#${groupId} .questions`);
  const allQuestions = document.querySelectorAll('.questions > .card');
  const globalQuestionNumber = allQuestions.length + 1;

  const html = `
    <div class="card">
      <label>Question ${globalQuestionNumber}:</label>
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
  let questionCounter = 1;

  sectionEls.forEach(sectionEl => {
    const title = sectionEl.querySelector('.section-title').value.trim();
    const passage = sectionEl.querySelector('.section-passage').value.trim();
    const groupEls = sectionEl.querySelectorAll('.subgroup');

    const questions = [];
    const questionGroups = [];

    groupEls.forEach(groupEl => {
      const groupInstructions = groupEl.querySelector('.group-instructions').value.trim();
      const questionEls = groupEl.querySelectorAll('.questions > .card');

      const groupQuestions = Array.from(questionEls).map(qEl => {
        const question = qEl.querySelector('.question-text').value.trim();
        const type = qEl.querySelector('.question-type').value;
        const optionsRaw = qEl.querySelector('.question-options').value.trim();
        const options = optionsRaw ? optionsRaw.split(',').map(s => s.trim()) : [];
        let answer = qEl.querySelector('.question-answer').value.trim();
        if (answer.includes(',') && type === 'short-answer') {
          answer = answer.split(',').map(s => s.trim());
        }
        return {
          number: questionCounter++,
          type,
          question,
          ...(options.length > 0 ? { options } : {}),
          answer
        };
      });

      const firstNum = groupQuestions[0]?.number;
      const lastNum = groupQuestions[groupQuestions.length - 1]?.number;
      if (firstNum && lastNum) {
        questionGroups.push({
          instructions: groupInstructions,
          questions: groupQuestions
        });
      }

      questions.push(...groupQuestions);
    });

    const sectionObj = { title, passage, questions, questionGroups };
    const firstNum = questions[0]?.number;
    const lastNum = questions[questions.length - 1]?.number;
    if (firstNum && lastNum) {
      sectionObj.title += ` (Questions ${firstNum}–${lastNum})`;
    }

    sections.push(sectionObj);
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
