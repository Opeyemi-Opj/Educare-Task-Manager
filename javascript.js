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
  let filtered;
  if (currentFilter === 'active') {
    filtered = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = tasks.filter(t => t.completed);
  } else {
    filtered = [...tasks];
  }

  // Sort to show active tasks on top
  return filtered.sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function showConfirmDialog(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">Confirm Action</div>
      <div class="modal-body">${message}</div>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel">Cancel</button>
        <button class="modal-btn modal-btn-confirm">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cancelBtn = overlay.querySelector('.modal-btn-cancel');
  const confirmBtn = overlay.querySelector('.modal-btn-confirm');

  function closeModal() {
    overlay.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => overlay.remove(), 300);
  }

  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  confirmBtn.addEventListener('click', () => {
    onConfirm();
    closeModal();
  });
}

function updateStatistics() {
  const total = tasks.length;
  const active = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t => t.completed).length;

  document.querySelector('#filter-all .count').textContent = total;
  document.querySelector('#filter-active .count').textContent = active;
  document.querySelector('#filter-completed .count').textContent = completed;
}

function renderTasks() {
  const taskList = document.getElementById('task-list');
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    const emptyIcon = currentFilter === 'completed' ? '🎉' :
                      currentFilter === 'active' ? '📝' : '📋';
    const emptyText = currentFilter === 'completed' ? 'No completed tasks yet' :
                      currentFilter === 'active' ? 'No active tasks' : 'No tasks yet';
    const emptyHint = currentFilter === 'all' ? 'Add your first task above!' : '';

    taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${emptyIcon}</div>
        <div class="empty-state-text">${emptyText}</div>
        <div class="empty-state-hint">${emptyHint}</div>
      </div>
    `;
    updateStatistics();
    return;
  }

  taskList.innerHTML = filtered.map((task, index) => `
    <li class="task-item ${task.completed ? 'task-completed' : ''}"
        data-id="${task.id}"
        style="animation-delay: ${index * 0.05}s">
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

  updateStatistics();
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
    animation: fadeIn 0.3s ease-out;
  `;

  titleSpan.replaceWith(input);
  input.focus();
  input.select();

  function saveEdit() {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== currentTitle) {
      updateTask(taskId, { title: newTitle });
      showToast('Task updated successfully!', 'success');
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
    taskItem.classList.add('task-completing');

    setTimeout(() => {
      const wasCompleted = tasks.find(t => t.id === taskId)?.completed;
      toggleTask(taskId);

      if (!wasCompleted) {
        showToast('Task completed!', 'success');
      }

      renderTasks();
    }, 300);
  } else if (button.classList.contains('delete-btn')) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    showConfirmDialog(
      `Are you sure you want to delete "${task.title}"?`,
      () => {
        taskItem.classList.add('task-removing');

        setTimeout(() => {
          deleteTask(taskId);
          showToast('Task deleted', 'error');
          renderTasks();
        }, 400);
      }
    );
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const input = document.getElementById('task-title');
  const title = input.value;

  if (addTask(title)) {
    input.value = '';
    showToast('Task added successfully!', 'success');
    renderTasks();
    input.focus();
  } else {
    input.classList.add('error');
    setTimeout(() => {
      input.classList.remove('error');
    }, 500);
  }
}

function init() {
  tasks = loadTasks();

  document.getElementById('task-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('task-list').addEventListener('click', handleTaskAction);

  document.getElementById('filter-all').addEventListener('click', () => setFilter('all'));
  document.getElementById('filter-active').addEventListener('click', () => setFilter('active'));
  document.getElementById('filter-completed').addEventListener('click', () => setFilter('completed'));

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      document.getElementById('task-title').focus();
    }
  });

  setFilter('all');

  if (tasks.length === 0) {
    setTimeout(() => {
      document.getElementById('task-title').focus();
    }, 800);
  }
}

document.addEventListener('DOMContentLoaded', init);
