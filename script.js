// DOM元素获取
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const totalTodos = document.getElementById('totalTodos');
const completedTodos = document.getElementById('completedTodos');
const pendingTodos = document.getElementById('pendingTodos');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const currentDate = document.getElementById('currentDate');

// 待办事项数组
let todos = [];

// 初始化应用
function init() {
    // 显示当前日期
    showCurrentDate();
    // 从本地存储加载待办事项
    loadTodos();
    // 渲染待办事项
    renderTodos();
    // 更新统计信息
    updateStats();
    // 添加事件监听器
    addEventListeners();
}

// 显示当前日期
function showCurrentDate() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    };
    currentDate.textContent = now.toLocaleDateString('zh-CN', options);
}

// 添加事件监听器
function addEventListeners() {
    // 添加待办事项按钮点击事件
    addTodoBtn.addEventListener('click', addTodo);
    // 输入框回车键事件
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    // 筛选按钮点击事件
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterTodos(e.target.dataset.filter);
        });
    });
    // 清除已完成按钮点击事件
    clearCompletedBtn.addEventListener('click', clearCompleted);
    // 清除全部按钮点击事件
    clearAllBtn.addEventListener('click', clearAll);
}

// 添加待办事项
function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') {
        alert('请输入待办事项内容');
        return;
    }
    
    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.push(todo);
    saveTodos();
    renderTodos();
    updateStats();
    todoInput.value = '';
    todoInput.focus();
}

// 渲染待办事项
function renderTodos(filter = 'all') {
    todoList.innerHTML = '';
    
    // 根据筛选条件过滤待办事项
    const filteredTodos = todos.filter(todo => {
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    });
    
    // 如果没有待办事项，显示空状态
    if (filteredTodos.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i>📝</i>
            <p>${filter === 'all' ? '还没有待办事项，添加一个吧！' : 
               filter === 'active' ? '没有待完成的事项，太棒了！' : 
               '没有已完成的事项，继续努力！'}</p>
        `;
        todoList.appendChild(emptyState);
        return;
    }
    
    // 渲染待办事项列表
    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="todo-content">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
            </div>
            <button class="delete-btn" data-id="${todo.id}">×</button>
        `;
        todoList.appendChild(li);
    });
    
    // 为新添加的元素添加事件监听器
    addTodoEventListeners();
}

// 添加待办事项元素的事件监听器
function addTodoEventListeners() {
    // 复选框事件
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            toggleTodo(e.target.dataset.id);
        });
    });
    
    // 删除按钮事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteTodo(e.target.dataset.id);
        });
    });
}

// 切换待办事项完成状态
function toggleTodo(id) {
    const todo = todos.find(t => t.id === parseInt(id));
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos(getCurrentFilter());
        updateStats();
    }
}

// 删除待办事项
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== parseInt(id));
    saveTodos();
    renderTodos(getCurrentFilter());
    updateStats();
}

// 更新统计信息
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    
    totalTodos.textContent = `总任务: ${total}`;
    completedTodos.textContent = `已完成: ${completed}`;
    pendingTodos.textContent = `待完成: ${pending}`;
}

// 获取当前筛选条件
function getCurrentFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

// 筛选待办事项
function filterTodos(filter) {
    // 更新筛选按钮状态
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    renderTodos(filter);
}

// 清除已完成待办事项
function clearCompleted() {
    if (todos.filter(t => t.completed).length === 0) {
        alert('没有已完成的待办事项');
        return;
    }
    
    if (confirm('确定要清除所有已完成的待办事项吗？')) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos(getCurrentFilter());
        updateStats();
    }
}

// 清除全部待办事项
function clearAll() {
    if (todos.length === 0) {
        alert('没有待办事项可以清除');
        return;
    }
    
    if (confirm('确定要清除所有待办事项吗？此操作不可恢复！')) {
        todos = [];
        saveTodos();
        renderTodos(getCurrentFilter());
        updateStats();
    }
}

// 保存待办事项到本地存储
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 从本地存储加载待办事项
function loadTodos() {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
        todos = JSON.parse(storedTodos);
    }
}

// HTML转义函数，防止XSS攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初始化应用
init();