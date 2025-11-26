let tasks = [];
let currentFilter = 'active';

const taskList = document.getElementById('task-list');

// Get current datetime in YYYY-MM-DDTHH:MM format for datetime validation
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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

  // Multi-criteria sorting:
  return filtered.sort((a, b) => {
    // First: completed status (active tasks first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Second: priority (high to low)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // Third: due date (soonest first)
    // Tasks with no due date go after tasks with due dates
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    // Fourth: creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
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

function showTaskDialog(task = null, onSave) {
  const isEdit = task !== null;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const minDateTime = getCurrentDateTime();
  const title = isEdit ? escapeHtml(task.title) : '';
  const description = isEdit ? escapeHtml(task.description) : '';
  const priority = isEdit ? task.priority : 1;
  // Format existing datetime for datetime-local input
  const dueDate = isEdit && task.dueDate ? task.dueDate.substring(0, 16) : '';

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">${isEdit ? 'Edit Task' : 'Add New Task'}</div>
      <div class="modal-body">
        <input type="text" id="task-title" value="${title}" placeholder="Task title" style="width:100%;padding:10px;border:2px solid rgba(79,157,255,0.3);border-radius:8px;background:#101829;color:#e8ecf4;margin-bottom:12px;font-family:Poppins;font-size:0.95rem;outline:none;" />
        <textarea id="task-description" placeholder="Task description (optional)" style="width:100%;padding:10px;border:2px solid rgba(79,157,255,0.3);border-radius:8px;background:#101829;color:#e8ecf4;margin-bottom:12px;font-family:Poppins;font-size:0.9rem;resize:none;height:70px;outline:none;">${description}</textarea>
        <select id="task-priority" style="width:100%;padding:10px;border:2px solid rgba(79,157,255,0.3);border-radius:8px;background:#101829;color:#e8ecf4;margin-bottom:12px;font-family:Poppins;outline:none;">
          <option value="1" ${priority === 1 ? 'selected' : ''}>Low Priority</option>
          <option value="2" ${priority === 2 ? 'selected' : ''}>Medium Priority</option>
          <option value="3" ${priority === 3 ? 'selected' : ''}>High Priority</option>
        </select>
        <input type="datetime-local" id="task-duedate" value="${dueDate}" min="${minDateTime}" style="width:100%;padding:10px;border:2px solid rgba(79,157,255,0.3);border-radius:8px;background:#101829;color:#e8ecf4;font-family:Poppins;outline:none;" />
      </div>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel">Cancel</button>
        <button class="modal-btn modal-btn-confirm">${isEdit ? 'Save' : 'Add Task'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cancelBtn = overlay.querySelector('.modal-btn-cancel');
  const saveBtn = overlay.querySelector('.modal-btn-confirm');
  const titleInput = overlay.querySelector('#task-title');
  const dateInput = overlay.querySelector('#task-duedate');

  saveBtn.style.background = '#4f9dff';

  // Focus on title input
  setTimeout(() => titleInput.focus(), 100);

  function closeModal() {
    overlay.remove();
  }

  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  saveBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    if (!title) {
      showToast('Title cannot be empty', 'error');
      titleInput.style.borderColor = 'var(--error)';
      return;
    }

    const description = document.getElementById('task-description').value.trim();
    const priority = parseInt(document.getElementById('task-priority').value);
    const dueDate = dateInput.value || null;

    if (isEdit) {
      updateTask(task.id, { title, description, priority, dueDate });
      showToast('Task updated!', 'success');
    } else {
      addTask(title, description, priority, dueDate);
      showToast('Task added successfully!', 'success');
    }

    onSave();
    closeModal();
  });

  // Allow Enter to submit (only when not in textarea)
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id !== 'task-description') {
      e.preventDefault();
      saveBtn.click();
    }
    if (e.key === 'Escape') {
      closeModal();
    }
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
    const emptyHint = currentFilter === 'all' ? 'Click below to add your first task!' :
                      currentFilter === 'active' ? 'Click below to create a task!' : '';

    taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${emptyIcon}</div>
        <div class="empty-state-text">${emptyText}</div>
        <div class="empty-state-hint">${emptyHint}</div>
        ${currentFilter !== 'completed' ? '<button class="empty-state-btn" id="empty-add-task">+ Add New Task</button>' : ''}
      </div>
    `;

    // Add click handler for empty state button
    const emptyBtn = document.getElementById('empty-add-task');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => {
        showTaskDialog(null, () => {
          renderTasks();
        });
      });
    }

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

    showTaskDialog(task, () => {
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

function init() {
  tasks = loadTasks();

  // FAB button click handler (desktop - inline)
  const fabButton = document.getElementById('fab-add-task');
  fabButton.addEventListener('click', () => {
    showTaskDialog(null, () => {
      renderTasks();
    });
  });

  // FAB button click handler (mobile - floating)
  const fabMobileButton = document.getElementById('fab-add-task-mobile');
  fabMobileButton.addEventListener('click', () => {
    showTaskDialog(null, () => {
      renderTasks();
    });
  });

  taskList.addEventListener('click', handleTaskAction);

  document.getElementById('filter-all').addEventListener('click', () => setFilter('all'));
  document.getElementById('filter-active').addEventListener('click', () => setFilter('active'));
  document.getElementById('filter-completed').addEventListener('click', () => setFilter('completed'));

  // Keyboard shortcut to open add task modal
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      fabButton.click();
    }
  });

  setFilter('active');
}

document.addEventListener('DOMContentLoaded', init);