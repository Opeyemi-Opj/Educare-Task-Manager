let tasks = [];
let currentFilter = 'all';

const titleInput = document.getElementById('task-title');
const optionalFields = document.getElementById('optional-fields');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

// Toggle optional fields visibility
titleInput.addEventListener('input', () => {
  if (titleInput.value.trim()) {
    optionalFields.classList.add('visible');
  } else {
    optionalFields.classList.remove('visible');
  }
});

function loadTasks() {
  const stored = localStorage.getItem('educareTasks');
  return stored ? JSON.parse(stored) : [];
}

function saveTasks() {
  localStorage.setItem('educareTasks', JSON.stringify(tasks));
}

function addTask(title, description, priority, dueDate) {
  const trimmed = title.trim();
  if (!trimmed) return false;

  const task = {
    id: Date.now(),
    title: trimmed,
    description: description.trim(),
    priority: parseInt(priority) || 1,
    dueDate: dueDate || null,
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPriorityLabel(priority) {
  const labels = { 1: 'Low', 2: 'Medium', 3: 'High' };
  return labels[priority] || 'Low';
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

function showEditDialog(task, onUpdate) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">Edit Task</div>
      <div class="modal-body">
        <input type="text" id="edit-title" value="${escapeHtml(task.title)}" placeholder="Task title" style="width:100%;padding:10px;border:2px solid rgba(79,157,255,0.3);border-radius:8px;background:#101829;color:#e8ecf4;margin-bottom:12px;font-family:Poppins;font-size:0.95rem;outline:none;" />
        <textarea id="edit-description" placeholder="Task description" style="width:100%;padding:10px;border:2px solid rgba(79,157,255,0.3);border-radius:8px;background:#101829;color:#e8ecf4;margin-bottom:12px;font-family:Poppins;font-size:0.9rem;resize:none;height:70px;outline:none;">${escapeHtml(task.description)}</textarea>
        <select id="edit-priority" style="width:100%;padding:10px;border:2px solid rgba(79,157,255,0.3);border-radius:8px;background:#101829;color:#e8ecf4;margin-bottom:12px;font-family:Poppins;outline:none;">
          <option value="1" ${task.priority === 1 ? 'selected' : ''}>Low</option>
          <option value="2" ${task.priority === 2 ? 'selected' : ''}>Medium</option>
          <option value="3" ${task.priority === 3 ? 'selected' : ''}>High</option>
        </select>
        <input type="date" id="edit-duedate" value="${task.dueDate ? task.dueDate.split('T')[0] : ''}" style="width:100%;padding:10px;border:2px solid rgba(79,157,255,0.3);border-radius:8px;background:#101829;color:#e8ecf4;font-family:Poppins;outline:none;" />
      </div>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel">Cancel</button>
        <button class="modal-btn modal-btn-confirm">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cancelBtn = overlay.querySelector('.modal-btn-cancel');
  const saveBtn = overlay.querySelector('.modal-btn-confirm');
  saveBtn.style.background = '#4f9dff';

  function closeModal() {
    overlay.remove();
  }

  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  saveBtn.addEventListener('click', () => {
    const title = document.getElementById('edit-title').value.trim();
    if (!title) return showToast('Title cannot be empty', 'error');

    updateTask(task.id, {
      title: title,
      description: document.getElementById('edit-description').value.trim(),
      priority: parseInt(document.getElementById('edit-priority').value),
      dueDate: document.getElementById('edit-duedate').value || null
    });

    showToast('Task updated!', 'success');
    onUpdate();
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
      <div class="task-header">
        <div class="task-title-section">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">
            <span class="task-priority priority-${task.priority}">Priority: ${getPriorityLabel(task.priority)}</span>
            ${task.dueDate ? `<span>Due: ${formatDate(task.dueDate)}</span>` : ''}
          </div>
          ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="task-actions">
          <button class="edit-btn" title="Edit">✏️</button>
          <button class="toggle-btn" title="${task.completed ? 'Undo' : 'Mark Complete'}">
            ${task.completed ? '↶' : '✓'}
          </button>
          <button class="delete-btn" title="Delete">🗑</button>
        </div>
      </div>
    </li>
  `).join('');

  updateStatistics();
}

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll('#task-filters button').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(`filter-${filter}`).classList.add('active');
  renderTasks();
}

function handleTaskAction(e) {
  const button = e.target.closest('button');
  const taskItem = e.target.closest('.task-item');
  
  if (!taskItem) return;

  const taskId = parseInt(taskItem.dataset.id);

  // If clicking on title section (not a button), toggle description
  if (!button && e.target.closest('.task-title-section')) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.description) {
      taskItem.classList.toggle('expanded');
    }
    return;
  }

  if (!button) return;

  if (button.classList.contains('edit-btn')) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    showEditDialog(task, () => {
      renderTasks();
    });
  } else if (button.classList.contains('toggle-btn')) {
    const wasCompleted = tasks.find(t => t.id === taskId)?.completed;
    toggleTask(taskId);

    if (!wasCompleted) {
      showToast('Task completed!', 'success');
    }

    renderTasks();
  } else if (button.classList.contains('delete-btn')) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    showConfirmDialog(
      `Are you sure you want to delete "${task.title}"?`,
      () => {
        deleteTask(taskId);
        showToast('Task deleted', 'error');
        renderTasks();
      }
    );
  }
}

function handleFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;
  const priority = document.getElementById('task-priority').value;
  const dueDate = document.getElementById('task-duedate').value;

  if (addTask(title, description, priority, dueDate)) {
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-priority').value = '1';
    document.getElementById('task-duedate').value = '';
    optionalFields.classList.remove('visible');
    showToast('Task added successfully!', 'success');
    renderTasks();
    document.getElementById('task-title').focus();
  } else {
    document.getElementById('task-title').classList.add('error');
    setTimeout(() => {
      document.getElementById('task-title').classList.remove('error');
    }, 500);
  }
}

function init() {
  tasks = loadTasks();

  taskForm.addEventListener('submit', handleFormSubmit);
  taskList.addEventListener('click', handleTaskAction);

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