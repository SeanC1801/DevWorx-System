const STORAGE_KEY = "focusQuestData_v1";

const XP_VALUES = {
  easy: 10,
  medium: 25,
  hard: 45,
};

const MAX_HEALTH = 100;
const XP_PER_LEVEL = 100;

const defaultState = {
  profile: {
    username: "Mindful Quester",
    level: 1,
    xp: 0,
    health: MAX_HEALTH,
  },
  ui: {
    currentView: "todo",
    calendarProgress: false,
    activePage: "home-page",
    theme: "light",
  },
  tasks: [],
  dailyTasks: [],
  history: {},
  pet: {
    xp: 0,
    health: 5,
    hunger: 0,
    weakness: 0,
  },
};

let state = loadState();
let editingContext = { listKey: "tasks", taskId: null };

const refs = {
  username: document.getElementById("username"),
  level: document.getElementById("level-value"),
  xpValue: document.getElementById("xp-value"),
  xpFill: document.getElementById("xp-fill"),
  healthValue: document.getElementById("health-value"),
  healthFill: document.getElementById("health-fill"),
  taskList: document.getElementById("task-list"),
  taskSubtitle: document.getElementById("task-subtitle"),
  tabButtons: document.querySelectorAll(".tab-btn"),
  navButtons: document.querySelectorAll(".nav-btn[data-page]"),
  pages: document.querySelectorAll(".page"),
  newTaskBtn: document.getElementById("new-task-btn"),
  calendarModeBtn: document.getElementById("calendar-mode-btn"),
  calendarMeta: document.getElementById("calendar-meta"),
  calendarGrid: document.getElementById("calendar-grid"),
  modal: document.getElementById("task-modal"),
  taskForm: document.getElementById("task-form"),
  modalTitle: document.getElementById("modal-title"),
  taskTitleInput: document.getElementById("task-title-input"),
  difficultyInput: document.getElementById("difficulty-input"),
  dueDateInput: document.getElementById("due-date-input"),
  dueDateWrapper: document.getElementById("due-date-wrapper"),
  closeModalBtn: document.getElementById("close-modal-btn"),
  cancelBtn: document.getElementById("cancel-btn"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  petXpValue: document.getElementById("pet-xp-value"),
  petXpFill: document.getElementById("pet-xp-fill"),
  petHealth: document.getElementById("pet-health"),
  petHunger: document.getElementById("pet-hunger"),
  petWeakness: document.getElementById("pet-weakness"),
  toast: document.getElementById("toast"),
};

init();

function init() {
  applyTheme();
  bindEvents();
  evaluateMissedTasks();
  render();
}

function bindEvents() {
  refs.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.currentView = button.dataset.view;
      saveState();
      renderTaskPanel();
    });
  });

  refs.newTaskBtn.addEventListener("click", () => {
    openTaskModal();
  });

  refs.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.activePage = button.dataset.page;
      saveState();
      renderPages();
    });
  });

  refs.calendarModeBtn.addEventListener("click", () => {
    state.ui.calendarProgress = !state.ui.calendarProgress;
    saveState();
    renderCalendar();
  });

  refs.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleTaskSave();
  });

  refs.closeModalBtn.addEventListener("click", closeTaskModal);
  refs.cancelBtn.addEventListener("click", closeTaskModal);
  refs.themeToggleBtn.addEventListener("click", toggleTheme);
}

function render() {
  renderPages();
  renderTopBar();
  renderTaskPanel();
  renderCalendar();
  renderPetPanel();
}

function renderPages() {
  refs.pages.forEach((page) => {
    page.classList.toggle("active", page.id === state.ui.activePage);
  });
  refs.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === state.ui.activePage);
  });
}

function renderTopBar() {
  refs.username.textContent = state.profile.username;
  refs.level.textContent = state.profile.level;
  refs.xpValue.textContent = `${state.profile.xp} / ${XP_PER_LEVEL}`;

  const xpPercent = Math.min((state.profile.xp / XP_PER_LEVEL) * 100, 100);
  refs.xpFill.style.width = `${xpPercent}%`;
  const healthValue = Math.max(0, Math.min(MAX_HEALTH, state.profile.health));
  refs.healthValue.textContent = `${healthValue} / ${MAX_HEALTH}`;
  refs.healthFill.style.width = `${healthValue}%`;
}

function renderTaskPanel() {
  refs.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.ui.currentView);
  });

  const listKey = state.ui.currentView === "todo" ? "tasks" : "dailyTasks";
  const activeTasks = state[listKey];

  refs.taskSubtitle.textContent =
    state.ui.currentView === "todo"
      ? "Plan longer tasks with due dates and keep your streak alive."
      : "Small recurring wins to build consistency every day.";

  refs.taskList.innerHTML = "";

  if (activeTasks.length === 0) {
    refs.taskList.innerHTML = `
      <div class="empty-state">
        <p>No tasks yet. Add one to start your progress loop.</p>
      </div>
    `;
    return;
  }

  activeTasks.forEach((task) => {
    refs.taskList.appendChild(createTaskCard(task, listKey));
  });
}

function createTaskCard(task, listKey) {
  const item = document.createElement("article");
  item.className = `task-item ${task.completed ? "completed" : ""}`;

  const dueLabel =
    listKey === "tasks" && task.dueDate
      ? `<span class="pill">Due: ${formatDate(task.dueDate)}</span>`
      : "";

  item.innerHTML = `
    <input type="checkbox" ${task.completed ? "checked" : ""} aria-label="Complete task" />
    <div>
      <p class="task-title">${escapeHtml(task.title)}</p>
      <div class="task-meta">
        <span class="pill ${task.difficulty}">${capitalize(task.difficulty)}</span>
        ${dueLabel}
      </div>
    </div>
    <div class="task-actions">
      <button class="icon-btn edit-btn" aria-label="Edit">✏️</button>
      <button class="icon-btn delete-btn" aria-label="Delete">🗑️</button>
    </div>
  `;

  item.querySelector('input[type="checkbox"]').addEventListener("change", () => {
    toggleTaskCompletion(listKey, task.id);
  });

  item.querySelector(".edit-btn").addEventListener("click", () => {
    openTaskModal(task, listKey);
  });

  item.querySelector(".delete-btn").addEventListener("click", () => {
    deleteTask(listKey, task.id);
  });

  return item;
}

function openTaskModal(task = null, listKey = null) {
  const actualKey = listKey || (state.ui.currentView === "todo" ? "tasks" : "dailyTasks");
  editingContext = { listKey: actualKey, taskId: task?.id || null };

  refs.modalTitle.textContent = task ? "Edit Task" : "Add Task";
  refs.taskTitleInput.value = task?.title || "";
  refs.difficultyInput.value = task?.difficulty || "easy";
  refs.dueDateInput.value = task?.dueDate || "";

  const isTodo = actualKey === "tasks";
  refs.dueDateWrapper.style.display = isTodo ? "grid" : "none";

  if (!isTodo) {
    refs.dueDateInput.value = "";
  }

  refs.modal.showModal();
}

function closeTaskModal() {
  refs.taskForm.reset();
  refs.modal.close();
}

function handleTaskSave() {
  const title = refs.taskTitleInput.value.trim();
  const difficulty = refs.difficultyInput.value;
  const dueDate = refs.dueDateInput.value;

  if (!title) return;

  const { listKey, taskId } = editingContext;

  const payload = {
    title,
    difficulty,
    dueDate: listKey === "tasks" ? dueDate || null : null,
  };

  if (taskId) {
    state[listKey] = state[listKey].map((task) =>
      task.id === taskId ? { ...task, ...payload } : task
    );
    showToast("Task updated");
  } else {
    state[listKey].unshift({
      id: crypto.randomUUID(),
      ...payload,
      completed: false,
      xpGranted: false,
      lifePenaltyApplied: false,
      createdAt: new Date().toISOString(),
    });
    showToast("Task created");
  }

  saveState();
  closeTaskModal();
  render();
}

function deleteTask(listKey, taskId) {
  state[listKey] = state[listKey].filter((task) => task.id !== taskId);
  saveState();
  showToast("Task deleted");
  render();
}

function toggleTaskCompletion(listKey, taskId) {
  const tasks = state[listKey];
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.completed = !task.completed;

  // Only grant XP once per task completion.
  if (task.completed && !task.xpGranted) {
    const xpGain = XP_VALUES[task.difficulty];
    applyXpGain(xpGain);
    applyPetGain(xpGain);
    task.xpGranted = true;
    showToast(`+${xpGain} XP earned`);
  } else if (!task.completed) {
    showToast("Task marked incomplete");
  }

  updateHistoryForTask(task, listKey);
  saveState();
  render();
}

function applyXpGain(xpGain) {
  state.profile.xp += xpGain;

  while (state.profile.xp >= XP_PER_LEVEL) {
    state.profile.xp -= XP_PER_LEVEL;
    state.profile.level += 1;
    showToast(`Level up! You are now Lv. ${state.profile.level}`);
  }
}

function applyPetGain(xpGain) {
  state.pet.xp += Math.ceil(xpGain * 0.65);
  state.pet.hunger = Math.max(0, state.pet.hunger - 1);
  state.pet.weakness = Math.max(0, state.pet.weakness - 1);
  if (state.pet.xp >= XP_PER_LEVEL) {
    state.pet.xp -= XP_PER_LEVEL;
    state.pet.health = Math.min(10, state.pet.health + 1);
    showToast("Your dragon feels stronger.");
  }
}

function evaluateMissedTasks() {
  const today = getTodayString();
  let missedCount = 0;

  state.tasks = state.tasks.map((task) => {
    const isMissed = !task.completed && task.dueDate && task.dueDate < today;
    if (isMissed && !task.lifePenaltyApplied) {
      task.lifePenaltyApplied = true;
      missedCount += 1;
    }
    return task;
  });

  if (missedCount > 0) {
    const healthLoss = missedCount * 20;
    state.profile.health = Math.max(0, state.profile.health - healthLoss);
    state.pet.health = Math.max(1, state.pet.health - missedCount);
    state.pet.hunger = Math.min(10, state.pet.hunger + missedCount);
    state.pet.weakness = Math.min(10, state.pet.weakness + missedCount);
    showToast(`-${healthLoss} health from missed tasks`);
  }

  if (state.profile.health === 0) {
    showToast("Health depleted. Resetting for a fresh start.");
    resetProgress();
  }

  rebuildHistory();
  saveState();
}

function resetProgress() {
  state.profile.health = MAX_HEALTH;
  state.profile.xp = 0;
  state.profile.level = 1;
  state.pet.xp = 0;
  state.pet.health = 5;
  state.pet.hunger = 0;
  state.pet.weakness = 0;

  // Keeps tasks but clears completion state for a fresh cycle.
  [...state.tasks, ...state.dailyTasks].forEach((task) => {
    task.completed = false;
    task.xpGranted = false;
    task.lifePenaltyApplied = false;
  });
}

function updateHistoryForTask(task, listKey) {
  const key = task.dueDate || getTodayString();
  if (!state.history[key]) {
    state.history[key] = { total: 0, completed: 0, missed: 0 };
  }

  if (listKey === "dailyTasks" || !task.dueDate) {
    const today = getTodayString();
    if (!state.history[today]) {
      state.history[today] = { total: 0, completed: 0, missed: 0 };
    }
    state.history[today].total += 1;
    if (task.completed) state.history[today].completed += 1;
    return;
  }

  state.history[key].total += 1;
  if (task.completed) state.history[key].completed += 1;
  if (!task.completed && task.lifePenaltyApplied) state.history[key].missed += 1;
}

function rebuildHistory() {
  state.history = {};
  state.tasks.forEach((task) => {
    const key = task.dueDate || getTodayString();
    if (!state.history[key]) state.history[key] = { total: 0, completed: 0, missed: 0 };
    state.history[key].total += 1;
    if (task.completed) state.history[key].completed += 1;
    if (!task.completed && task.lifePenaltyApplied) state.history[key].missed += 1;
  });
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  refs.calendarGrid.innerHTML = "";

  refs.calendarModeBtn.textContent = state.ui.calendarProgress ? "Normal View" : "Progress View";
  refs.calendarMeta.textContent = state.ui.calendarProgress
    ? "Green: completed, Red: missed, Gray: no tasks"
    : now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.textContent = day;

    if (day === today) {
      cell.classList.add("today");
    }

    if (state.ui.calendarProgress) {
      const key = formatAsDateString(year, month + 1, day);
      const status = getProgressStatusForDate(key);
      cell.classList.add(
        status === "complete"
          ? "progress-complete"
          : status === "missed"
          ? "progress-missed"
          : "progress-empty"
      );
    }

    refs.calendarGrid.appendChild(cell);
  }
}

function renderPetPanel() {
  refs.petXpValue.textContent = `${state.pet.xp} / ${XP_PER_LEVEL}`;
  refs.petXpFill.style.width = `${Math.min((state.pet.xp / XP_PER_LEVEL) * 100, 100)}%`;
  refs.petHealth.textContent = state.pet.health;
  refs.petHunger.textContent = state.pet.hunger;
  refs.petWeakness.textContent = state.pet.weakness;
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.ui.theme);
  refs.themeToggleBtn.textContent =
    state.ui.theme === "light" ? "Switch to Dark" : "Switch to Light";
}

function toggleTheme() {
  state.ui.theme = state.ui.theme === "light" ? "dark" : "light";
  applyTheme();
  saveState();
}

function getProgressStatusForDate(dateKey) {
  const records = state.history[dateKey];
  if (!records || records.total === 0) return "empty";
  if (records.completed === records.total) return "complete";
  if (records.missed > 0 || records.completed < records.total) return "missed";
  return "empty";
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    refs.toast.classList.remove("show");
  }, 1700);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const saved = JSON.parse(raw);
    const migratedHealth =
      saved?.profile?.health ??
      (typeof saved?.profile?.lives === "number"
        ? Math.round((saved.profile.lives / 5) * MAX_HEALTH)
        : MAX_HEALTH);
    return {
      ...structuredClone(defaultState),
      ...saved,
      profile: { ...defaultState.profile, ...(saved.profile || {}), health: migratedHealth },
      ui: { ...defaultState.ui, ...(saved.ui || {}) },
      tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
      dailyTasks: Array.isArray(saved.dailyTasks) ? saved.dailyTasks : [],
      history: saved.history && typeof saved.history === "object" ? saved.history : {},
      pet: { ...defaultState.pet, ...(saved.pet || {}) },
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTodayString() {
  const now = new Date();
  return formatAsDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function formatAsDateString(year, month, day) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
