let tasks = [];
let currentFilter = 'all';

function loadTasks() {
  const stored = localStorage.getItem('educareTasks');
  return stored ? JSON.parse(stored) : [];
}

function saveTasks() {
  localStorage.setItem('educareTasks', JSON.stringify(tasks));
}

function addTask(title) {
  const trimmed = title.trim();
  if (!trimmed) return false;

  const task = {
    id: Date.now(),
    title: trimmed,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  saveTasks();
  return true;
}

function updateTask(id, updates) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    Object.assign(task, updates);
    saveTasks();
    return true;
  }
  return false;
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    return true;
  }
  return false;
}

function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks.splice(index, 1);
    saveTasks();
    return true;
  }
  return false;
}

function getFilteredTasks() {
  if (currentFilter === 'active') {
    return tasks.filter(t => !t.completed);
  }
  if (currentFilter === 'completed') {
    return tasks.filter(t => t.completed);
  }
  return tasks;
}

function renderTasks() {
  const taskList = document.getElementById('task-list');
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    taskList.innerHTML = '<li style="text-align:center; color:var(--muted); padding:20px;">No tasks found</li>';
    return;
  }

  taskList.innerHTML = filtered.map(task => `
    <li class="task-item ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
      <span class="task-title">${escapeHtml(task.title)}</span>
      <div class="task-actions">
        <button class="edit-btn" title="Edit">&#9998;</button>
        <button class="toggle-btn" title="${task.completed ? 'Undo' : 'Mark Complete'}">
          ${task.completed ? '&#8635;' : '&#10003;'}
        </button>
        <button class="delete-btn" title="Delete">&#128465;</button>
      </div>
    </li>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll('#task-filters button').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(`filter-${filter}`).classList.add('active');
  renderTasks();
}

function enableEditMode(taskItem) {
  const taskId = parseInt(taskItem.dataset.id);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const titleSpan = taskItem.querySelector('.task-title');
  const currentTitle = task.title;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTitle;
  input.className = 'edit-input';
  input.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    border: 2px solid var(--accent);
    border-radius: 8px;
    background: #0e1628;
    color: var(--text);
    font-size: 0.95rem;
    outline: none;
  `;

  titleSpan.replaceWith(input);
  input.focus();
  input.select();

  function saveEdit() {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== currentTitle) {
      updateTask(taskId, { title: newTitle });
    }
    renderTasks();
  }

  input.addEventListener('blur', saveEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      renderTasks();
    }
  });
}

function handleTaskAction(e) {
  const button = e.target.closest('button');
  if (!button) return;

  const taskItem = button.closest('.task-item');
  if (!taskItem) return;

  const taskId = parseInt(taskItem.dataset.id);

  if (button.classList.contains('edit-btn')) {
    enableEditMode(taskItem);
  } else if (button.classList.contains('toggle-btn')) {
    toggleTask(taskId);
    renderTasks();
  } else if (button.classList.contains('delete-btn')) {
    deleteTask(taskId);
    renderTasks();
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const input = document.getElementById('task-title');
  const title = input.value;

  if (addTask(title)) {
    input.value = '';
    renderTasks();
    input.focus();
  } else {
    input.style.borderColor = '#ff4444';
    setTimeout(() => {
      input.style.borderColor = '';
    }, 1500);
  }
}

function init() {
  tasks = loadTasks();

  document.getElementById('task-form').addEventListener('submit', handleFormSubmit);

  document.getElementById('task-list').addEventListener('click', handleTaskAction);

  document.getElementById('filter-all').addEventListener('click', () => setFilter('all'));
  document.getElementById('filter-active').addEventListener('click', () => setFilter('active'));
  document.getElementById('filter-completed').addEventListener('click', () => setFilter('completed'));

  setFilter('all');
}

document.addEventListener('DOMContentLoaded', init);
