const STORAGE_KEY = "recruit-green-data-v1";
const app = document.getElementById("app");

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const loadStore = () => {
  const initial = { forms: {}, applications: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && parsed.forms ? parsed : initial;
  } catch {
    return initial;
  }
};

const saveStore = (store) => localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

const getBaseUrl = () => `${window.location.origin}${window.location.pathname}`;

function createQuestion(question = { label: "", type: "text", required: true }) {
  return { id: makeId(), ...question };
}

function renderRecruiterView() {
  const template = document.getElementById("recruiter-template");
  app.replaceChildren(template.content.cloneNode(true));

  const store = loadStore();
  let questions = [
    createQuestion({ label: "Full name", type: "text", required: true }),
    createQuestion({ label: "Email", type: "email", required: true }),
  ];

  const questionList = document.getElementById("questionList");
  const status = document.getElementById("publishStatus");

  const renderQuestions = () => {
    questionList.innerHTML = "";
    questions.forEach((question) => {
      const wrapper = document.createElement("div");
      wrapper.className = "question-card";
      wrapper.innerHTML = `
        <div class="inline">
          <label>Question
            <input data-id="${question.id}" data-field="label" value="${question.label}" placeholder="e.g. Years of experience" />
          </label>
          <label>Type
            <select data-id="${question.id}" data-field="type">
              <option value="text" ${question.type === "text" ? "selected" : ""}>Short text</option>
              <option value="email" ${question.type === "email" ? "selected" : ""}>Email</option>
              <option value="tel" ${question.type === "tel" ? "selected" : ""}>Phone</option>
              <option value="textarea" ${question.type === "textarea" ? "selected" : ""}>Long text</option>
              <option value="url" ${question.type === "url" ? "selected" : ""}>URL</option>
            </select>
          </label>
          <button class="secondary" data-remove="${question.id}" type="button">Remove</button>
        </div>
        <label class="inline-check">
          <input type="checkbox" data-id="${question.id}" data-field="required" ${question.required ? "checked" : ""} />
          Required question
        </label>
      `;
      questionList.appendChild(wrapper);
    });
  };

  const renderPublishedForms = () => {
    const formsContainer = document.getElementById("publishedForms");
    formsContainer.innerHTML = "";
    const forms = Object.values(store.forms).filter((f) => f.status === "published");

    if (!forms.length) {
      formsContainer.innerHTML = '<p class="muted">No published forms yet.</p>';
      return;
    }

    forms
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach((form) => {
        const item = document.createElement("div");
        item.className = "form-item";
        const formUrl = `${getBaseUrl()}?form=${form.id}`;
        const submissions = Object.values(store.applications).filter((appItem) => appItem.formId === form.id).length;
        item.innerHTML = `
          <strong>${form.jobTitle}</strong>
          <p class="muted">${form.department} • ${submissions} submissions</p>
          <a class="form-link" href="${formUrl}" target="_blank" rel="noopener">${formUrl}</a>
        `;
        formsContainer.appendChild(item);
      });
  };

  questionList.addEventListener("input", (event) => {
    const target = event.target;
    if (!target.dataset.id) return;
    const question = questions.find((item) => item.id === target.dataset.id);
    if (!question) return;
    question[target.dataset.field] = target.type === "checkbox" ? target.checked : target.value;
  });

  questionList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove]");
    if (!button) return;
    questions = questions.filter((question) => question.id !== button.dataset.remove);
    renderQuestions();
  });

  document.getElementById("addQuestionBtn").addEventListener("click", () => {
    questions.push(createQuestion({ label: "", type: "text", required: false }));
    renderQuestions();
  });

  const saveForm = (statusValue) => {
    const jobTitle = document.getElementById("jobTitle").value.trim();
    const department = document.getElementById("jobDepartment").value.trim() || "General";
    const description = document.getElementById("jobDescription").value.trim();

    if (!jobTitle || !description) {
      status.className = "error";
      status.textContent = "Job title and description are required.";
      return;
    }

    const cleanQuestions = questions.filter((q) => q.label.trim());
    if (!cleanQuestions.length) {
      status.className = "error";
      status.textContent = "Add at least one question before saving.";
      return;
    }

    const formId = makeId();
    store.forms[formId] = {
      id: formId,
      jobTitle,
      department,
      description,
      questions: cleanQuestions,
      status: statusValue,
      createdAt: Date.now(),
    };
    saveStore(store);

    status.className = "success";
    const linkText = `${getBaseUrl()}?form=${formId}`;
    status.innerHTML = statusValue === "published"
      ? `Published successfully. Link: <a class="form-link" href="${linkText}" target="_blank" rel="noopener">${linkText}</a>`
      : "Draft saved.";

    if (statusValue === "published") {
      renderPublishedForms();
    }
  };

  document.getElementById("saveDraftBtn").addEventListener("click", () => saveForm("draft"));
  document.getElementById("publishBtn").addEventListener("click", () => saveForm("published"));

  renderQuestions();
  renderPublishedForms();
}

function renderCandidateView(formId) {
  const store = loadStore();
  const form = store.forms[formId];
  if (!form || form.status !== "published") {
    app.innerHTML = '<section class="panel"><h2>Form not found</h2><p class="muted">This job application link is invalid or no longer published.</p></section>';
    return;
  }

  const template = document.getElementById("candidate-template");
  app.replaceChildren(template.content.cloneNode(true));

  document.getElementById("candidateJobTitle").textContent = form.jobTitle;
  document.getElementById("candidateMeta").textContent = `Department: ${form.department}`;
  document.getElementById("candidateJobDescription").textContent = form.description;

  const formElement = document.getElementById("applicationForm");

  form.questions.forEach((question) => {
    const label = document.createElement("label");
    label.textContent = question.label;
    const input = question.type === "textarea"
      ? document.createElement("textarea")
      : document.createElement("input");

    input.name = question.id;
    if (question.type !== "textarea") {
      input.type = question.type;
    } else {
      input.rows = 4;
    }
    if (question.required) input.required = true;

    label.appendChild(input);
    formElement.appendChild(label);
  });

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Submit Application";
  formElement.appendChild(submit);

  formElement.addEventListener("submit", (event) => {
    event.preventDefault();

    const applicationId = makeId();
    const answers = {};
    const formData = new FormData(formElement);
    form.questions.forEach((question) => {
      answers[question.label] = formData.get(question.id);
    });

    store.applications[applicationId] = {
      id: applicationId,
      formId,
      submittedAt: Date.now(),
      answers,
    };
    saveStore(store);

    const uniqueLink = `${getBaseUrl()}?form=${formId}&app=${applicationId}`;
    window.location.href = uniqueLink;
  });
}

function renderApplicationReceipt(formId, applicationId) {
  const store = loadStore();
  const application = store.applications[applicationId];
  const form = store.forms[formId];

  if (!application || !form || application.formId !== formId) {
    app.innerHTML = '<section class="panel"><h2>Application not found</h2><p class="muted">The unique identifier does not match any submitted application.</p></section>';
    return;
  }

  const template = document.getElementById("application-template");
  app.replaceChildren(template.content.cloneNode(true));

  const link = `${getBaseUrl()}?form=${formId}&app=${applicationId}`;
  document.getElementById("applicationSummary").textContent = `Your application for ${form.jobTitle} has been received.`;
  const applicationLink = document.getElementById("applicationLink");
  applicationLink.textContent = link;
  applicationLink.href = link;
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const formId = params.get("form");
  const appId = params.get("app");

  if (formId && appId) {
    renderApplicationReceipt(formId, appId);
  } else if (formId) {
    renderCandidateView(formId);
  } else {
    renderRecruiterView();
  }
}

boot();
