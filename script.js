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
const themeSwitcher = document.getElementById('themeSwitcher');
const themeBtns = document.querySelectorAll('.theme-btn');
const currentDate = document.getElementById('currentDate');

// 待办事项数组
let todos = [];

// 主题相关
const themes = ['default', 'fresh', 'simple', 'dark'];
let currentTheme = 'default';

// 初始化应用
function init() {
    // 显示当前日期
    showCurrentDate();
    // 初始化主题
    initTheme();
    // 从本地存储加载待办事项
    loadTodos();
    // 同步review_tasks数据
    syncReviewTasks();
    // 渲染待办事项
    renderTodos();
    // 更新统计信息
    updateStats();
    // 添加事件监听器
    addEventListeners();
}

// 同步review_tasks数据
function syncReviewTasks() {
    // 读取localStorage中的review_tasks数据
    const reviewTasksJson = localStorage.getItem('review_tasks');
    if (reviewTasksJson) {
        try {
            const reviewTasks = JSON.parse(reviewTasksJson);
            if (Array.isArray(reviewTasks) && reviewTasks.length > 0) {
                // 转换review_tasks数据为当前格式
                const convertedTasks = reviewTasks.map(task => {
                    // 创建待办事项文本，包含任务信息
                    let taskText = task.name;
                    if (task.type) taskText += ` [${task.type}]`;
                    if (task.priority) taskText += ` (${task.priority})`;
                    if (task.note) taskText += ` - ${task.note}`;
                    
                    return {
                        id: task.id || Date.now() + Math.random(),
                        text: taskText,
                        completed: task.completed || false,
                        createdAt: new Date().toISOString()
                    };
                });
                
                // 合并数据，避免重复
                const existingIds = new Set(todos.map(todo => todo.id));
                const newTasks = convertedTasks.filter(task => !existingIds.has(task.id));
                
                // 添加新任务
                todos = [...todos, ...newTasks];
                // 保存到本地存储
                saveTodos();
            }
        } catch (error) {
            console.error('同步review_tasks数据失败:', error);
        }
    }
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
    // 主题切换按钮点击事件
    themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            if (theme) {
                switchTheme(theme);
            }
        });
    });
}

// 初始化主题
function initTheme() {
    // 从本地存储加载主题
    loadTheme();
    // 应用主题
    applyTheme();
    // 更新主题按钮状态
    updateThemeButtons();
}

// 从本地存储加载主题
function loadTheme() {
    const savedTheme = localStorage.getItem('todoTheme');
    if (savedTheme && themes.includes(savedTheme)) {
        currentTheme = savedTheme;
    }
}

// 保存主题到本地存储
function saveTheme() {
    localStorage.setItem('todoTheme', currentTheme);
}

// 应用主题
function applyTheme() {
    if (currentTheme === 'default') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }
    saveTheme();
}

// 切换主题
function switchTheme(theme) {
    currentTheme = theme;
    applyTheme();
    updateThemeButtons();
}

// 更新主题按钮状态
function updateThemeButtons() {
    themeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === currentTheme) {
            btn.classList.add('active');
        }
    });
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
    // 同步更新review_tasks数据
    updateReviewTasks();
}

// 更新review_tasks数据
function updateReviewTasks() {
    // 读取localStorage中的review_tasks数据
    const reviewTasksJson = localStorage.getItem('review_tasks');
    if (reviewTasksJson) {
        try {
            const reviewTasks = JSON.parse(reviewTasksJson);
            if (Array.isArray(reviewTasks)) {
                // 创建当前待办事项的映射，用于快速查找
                const currentTodosMap = new Map();
                todos.forEach(todo => {
                    // 提取任务名称，用于匹配review_tasks
                    const taskName = todo.text.split(' [')[0].split(' (')[0];
                    currentTodosMap.set(taskName, todo);
                });
                
                // 更新review_tasks的completed状态
                const updatedReviewTasks = reviewTasks.map(task => {
                    const matchingTodo = currentTodosMap.get(task.name);
                    if (matchingTodo) {
                        return {
                            ...task,
                            completed: matchingTodo.completed
                        };
                    }
                    return task;
                });
                
                // 保存更新后的review_tasks
                localStorage.setItem('review_tasks', JSON.stringify(updatedReviewTasks));
            }
        } catch (error) {
            console.error('更新review_tasks数据失败:', error);
        }
    }
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