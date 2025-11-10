// Система управления шаблонами для Telegram AutoPoster
class TemplateManager {
    constructor() {
        this.templates = this.loadTemplates();
        this.categories = [
            { id: 'news', name: 'Новости', icon: '📰' },
            { id: 'marketing', name: 'Маркетинг', icon: '📈' },
            { id: 'motivation', name: 'Мотивация', icon: '💪' },
            { id: 'education', name: 'Обучение', icon: '📚' },
            { id: 'entertainment', name: 'Развлечения', icon: '🎭' },
            { id: 'business', name: 'Бизнес', icon: '💼' }
        ];
        this.init();
    }

    init() {
        this.createDefaultTemplates();
        this.renderTemplateList();
        this.setupEventListeners();
    }

    loadTemplates() {
        const saved = localStorage.getItem('telegram-autoposter-templates');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load templates:', e);
            }
        }
        return [];
    }

    saveTemplates() {
        localStorage.setItem('telegram-autoposter-templates', JSON.stringify(this.templates));
    }

    createDefaultTemplates() {
        if (this.templates.length === 0) {
            this.templates = [
                {
                    id: 1,
                    name: 'Новостной пост',
                    content: `🔥 Свежие новости!

📌 {заголовок}

{описание}

Подробности по ссылке 👇
{ссылка}

#{теги}`,
                    category: 'news',
                    variables: ['заголовок', 'описание', 'ссылка', 'теги'],
                    created: new Date().toISOString(),
                    usage: 0
                },
                {
                    id: 2,
                    name: 'Маркетинговый совет',
                    content: `💡 Маркетинговый совет дня:

{совет}

Почему это работает:
{объяснение}

Как применить:
{инструкция}

Полезно? Лайкните и сохраните! 👍

#{теги}`,
                    category: 'marketing',
                    variables: ['совет', 'объяснение', 'инструкция', 'теги'],
                    created: new Date().toISOString(),
                    usage: 0
                },
                {
                    id: 3,
                    name: 'Мотивационный пост',
                    content: `🎯 {цель}

{мотивационный текст}

Запомните:
💪 {совет1}
🔥 {совет2}
✨ {совет3}

Дерзайте! Мы верим в вас! 🚀

#{теги}`,
                    category: 'motivation',
                    variables: ['цель', 'мотивационный текст', 'совет1', 'совет2', 'совет3', 'теги'],
                    created: new Date().toISOString(),
                    usage: 0
                },
                {
                    id: 4,
                    name: 'Обучающий пост',
                    content: `📚 Сегодня научимся: {тема}

📝 Шаг 1: {шаг1}
📝 Шаг 2: {шаг2}
📝 Шаг 3: {шаг3}

❗ Важно: {совет}

Практикуйтесь и делитесь результатами! 👇

#{теги}`,
                    category: 'education',
                    variables: ['тема', 'шаг1', 'шаг2', 'шаг3', 'совет', 'теги'],
                    created: new Date().toISOString(),
                    usage: 0
                },
                {
                    id: 5,
                    name: 'Развлекательный пост',
                    content: `😄 {заголовок}

{основной контент}

А вы знали?
🤔 {интересный факт}

Поделитесь в комментариях:
💬 {вопрос}

#{теги}`,
                    category: 'entertainment',
                    variables: ['заголовок', 'основной контент', 'интересный факт', 'вопрос', 'теги'],
                    created: new Date().toISOString(),
                    usage: 0
                },
                {
                    id: 6,
                    name: 'Бизнес-анонс',
                    content: `📢 Важный анонс!

{заголовок}

{описание}

📅 Дата: {дата}
⏰ Время: {время}
📍 Место: {место}

Регистрация: {ссылка}

Не пропустите! 🔥

#{теги}`,
                    category: 'business',
                    variables: ['заголовок', 'описание', 'дата', 'время', 'место', 'ссылка', 'теги'],
                    created: new Date().toISOString(),
                    usage: 0
                }
            ];
            this.saveTemplates();
        }
    }

    renderTemplateList() {
        const container = document.getElementById('template-list');
        if (!container) return;

        const categoryFilter = document.getElementById('template-category-filter')?.value || 'all';
        const searchTerm = document.getElementById('template-search')?.value.toLowerCase() || '';

        let filteredTemplates = this.templates;

        // Фильтрация по категории
        if (categoryFilter !== 'all') {
            filteredTemplates = filteredTemplates.filter(t => t.category === categoryFilter);
        }

        // Фильтрация по поисковому запросу
        if (searchTerm) {
            filteredTemplates = filteredTemplates.filter(t => 
                t.name.toLowerCase().includes(searchTerm) ||
                t.content.toLowerCase().includes(searchTerm)
            );
        }

        container.innerHTML = filteredTemplates.map(template => this.renderTemplateCard(template)).join('');
        this.updateTemplateStats();
    }

    renderTemplateCard(template) {
        const category = this.categories.find(c => c.id === template.category);
        const preview = template.content.substring(0, 100) + '...';
        
        return `
            <div class="template-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <span class="text-lg mr-2">${category?.icon || '📄'}</span>
                            <h3 class="font-semibold text-gray-800 text-sm">${template.name}</h3>
                        </div>
                        <div class="text-xs text-gray-500 mb-2">
                            ${category?.name || 'Без категории'} • ${template.variables?.length || 0} переменных
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="templateManager.editTemplate(${template.id})" 
                                class="text-blue-600 hover:text-blue-800 p-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="templateManager.deleteTemplate(${template.id})" 
                                class="text-red-600 hover:text-red-800 p-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <p class="text-sm text-gray-600 mb-3">${preview}</p>
                
                <div class="flex items-center justify-between">
                    <div class="text-xs text-gray-500">
                        Использовано: ${template.usage || 0} раз
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="templateManager.previewTemplate(${template.id})" 
                                class="text-blue-600 hover:text-blue-800 text-xs font-medium">
                            Предпросмотр
                        </button>
                        <button onclick="templateManager.useTemplate(${template.id})" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium">
                            Использовать
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCategoryFilter() {
        const container = document.getElementById('template-category-filter');
        if (!container) return;

        const options = [
            { value: 'all', text: 'Все категории' },
            ...this.categories.map(cat => ({ value: cat.id, text: `${cat.icon} ${cat.name}` }))
        ];

        container.innerHTML = options.map(option => 
            `<option value="${option.value}">${option.text}</option>`
        ).join('');
    }

    updateTemplateStats() {
        const totalElement = document.getElementById('template-total-count');
        const categoryElement = document.getElementById('template-category-count');
        
        if (totalElement) {
            totalElement.textContent = this.templates.length;
        }
        
        if (categoryElement) {
            const uniqueCategories = new Set(this.templates.map(t => t.category));
            categoryElement.textContent = uniqueCategories.size;
        }
    }

    // Методы управления шаблонами
    addTemplate(templateData) {
        const newTemplate = {
            id: Date.now(),
            ...templateData,
            created: new Date().toISOString(),
            usage: 0
        };
        
        this.templates.push(newTemplate);
        this.saveTemplates();
        this.renderTemplateList();
        notify.success('Шаблон добавлен успешно');
        
        return newTemplate;
    }

    editTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        // Создание модального окна для редактирования
        this.showEditModal(template);
    }

    deleteTemplate(templateId) {
        if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
            this.templates = this.templates.filter(t => t.id !== templateId);
            this.saveTemplates();
            this.renderTemplateList();
            notify.success('Шаблон удален');
        }
    }

    useTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        // Открытие модального окна создания поста с предзаполненным шаблоном
        this.showUseModal(template);
    }

    previewTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        // Показ предпросмотра шаблона
        this.showPreviewModal(template);
    }

    // Методы работы с переменными
    extractVariables(content) {
        const regex = /\{([^}]+)\}/g;
        const variables = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            variables.push(match[1]);
        }
        
        return [...new Set(variables)]; // Удаление дубликатов
    }

    fillTemplate(template, variables) {
        let filledContent = template.content;
        
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            filledContent = filledContent.replace(regex, value || '');
        }
        
        return filledContent;
    }

    // Модальные окна
    showEditModal(template) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-90vh overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold">Редактировать шаблон</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="edit-template-form">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Название</label>
                        <input type="text" id="template-name" value="${template.name}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                        <select id="template-category" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            ${this.categories.map(cat => 
                                `<option value="${cat.id}" ${cat.id === template.category ? 'selected' : ''}>
                                    ${cat.icon} ${cat.name}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Содержимое</label>
                        <textarea id="template-content" rows="8" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Используйте {переменные} для динамического контента">${template.content}</textarea>
                        <div class="text-xs text-gray-500 mt-1">
                            Используйте {переменные} для динамического контента
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                            Отмена
                        </button>
                        <button type="submit" 
                                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработка формы
        document.getElementById('edit-template-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedTemplate = {
                ...template,
                name: document.getElementById('template-name').value,
                category: document.getElementById('template-category').value,
                content: document.getElementById('template-content').value,
                variables: this.extractVariables(document.getElementById('template-content').value)
            };
            
            const index = this.templates.findIndex(t => t.id === template.id);
            if (index !== -1) {
                this.templates[index] = updatedTemplate;
                this.saveTemplates();
                this.renderTemplateList();
                notify.success('Шаблон обновлен');
            }
            
            modal.remove();
        });
    }

    showUseModal(template) {
        notify.info(`Шаблон "${template.name}" готов к использованию`);
        // Здесь можно открыть форму создания поста с предзаполненным шаблоном
    }

    showPreviewModal(template) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-90vh overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold">Предпросмотр: ${template.name}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <pre class="text-sm text-gray-800 whitespace-pre-wrap">${template.content}</pre>
                </div>
                
                <div class="mb-4">
                    <div class="text-sm font-medium text-gray-700 mb-2">Переменные:</div>
                    <div class="flex flex-wrap gap-2">
                        ${template.variables?.map(variable => 
                            `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{${variable}}</span>`
                        ).join('') || '<span class="text-gray-500 text-xs">Нет переменных</span>'}
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        Закрыть
                    </button>
                    <button onclick="templateManager.useTemplate(${template.id}); this.closest('.fixed').remove();" 
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Использовать
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Обработка фильтра категорий
        const categoryFilter = document.getElementById('template-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.renderTemplateList();
            });
        }

        // Обработка поиска
        const searchInput = document.getElementById('template-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.renderTemplateList();
            });
        }

        // Обработка создания нового шаблона
        const createBtn = document.getElementById('create-template-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateModal();
            });
        }
    }

    showCreateModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-90vh overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold">Создать шаблон</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form id="create-template-form">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Название</label>
                        <input type="text" id="new-template-name" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Введите название шаблона">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                        <select id="new-template-category" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            ${this.categories.map(cat => 
                                `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Содержимое</label>
                        <textarea id="new-template-content" rows="6" required
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Используйте {переменные} для динамического контента"></textarea>
                        <div class="text-xs text-gray-500 mt-1">
                            Используйте {переменные} для динамического контента
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                            Отмена
                        </button>
                        <button type="submit" 
                                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Создать
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработка формы
        document.getElementById('create-template-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newTemplate = {
                name: document.getElementById('new-template-name').value,
                category: document.getElementById('new-template-category').value,
                content: document.getElementById('new-template-content').value,
                variables: this.extractVariables(document.getElementById('new-template-content').value)
            };
            
            this.addTemplate(newTemplate);
            modal.remove();
        });
    }

    // Инициализация компонента
    init() {
        this.renderCategoryFilter();
        this.renderTemplateList();
        this.setupEventListeners();
    }
}

// Глобальный экземпляр менеджера шаблонов
const templateManager = new TemplateManager();