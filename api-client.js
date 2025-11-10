// API Client для взаимодействия с backend Telegram AutoPoster
class APIClient {
    constructor(baseURL = 'http://localhost:8080') {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Базовые методы HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            notify.error('Ошибка соединения с сервером');
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Health Check
    async healthCheck() {
        try {
            const response = await this.get('/api/health');
            return response.status === 'ok';
        } catch (error) {
            return false;
        }
    }

    // Groups API
    async getGroups() {
        return this.get('/api/groups');
    }

    async addGroup(groupData) {
        return this.post('/api/groups', groupData);
    }

    async updateGroup(groupId, groupData) {
        return this.put(`/api/groups/${groupId}`, groupData);
    }

    async deleteGroup(groupId) {
        return this.delete(`/api/groups/${groupId}`);
    }

    // Posts API
    async getPosts(status = 'all') {
        const params = status !== 'all' ? `?status=${status}` : '';
        return this.get(`/api/posts${params}`);
    }

    async createPost(postData) {
        return this.post('/api/posts', postData);
    }

    async updatePost(postId, postData) {
        return this.put(`/api/posts/${postId}`, postData);
    }

    async deletePost(postId) {
        return this.delete(`/api/posts/${postId}`);
    }

    // Templates API
    async getTemplates() {
        return this.get('/api/templates');
    }

    async createTemplate(templateData) {
        return this.post('/api/templates', templateData);
    }

    async updateTemplate(templateId, templateData) {
        return this.put(`/api/templates/${templateId}`, templateData);
    }

    async deleteTemplate(templateId) {
        return this.delete(`/api/templates/${templateId}`);
    }

    // Statistics API
    async getStats() {
        return this.get('/api/stats');
    }

    // Export API
    async exportData() {
        return this.post('/api/export', {});
    }
}

// Глобальный экземпляр API Client
const apiClient = new APIClient();

// Утилиты для работы с API
class APIUtils {
    static async loadInitialData() {
        try {
            const [groups, posts, templates, stats] = await Promise.all([
                apiClient.getGroups(),
                apiClient.getPosts(),
                apiClient.getTemplates(),
                apiClient.getStats()
            ]);

            return { groups, posts, templates, stats };
        } catch (error) {
            console.error('Failed to load initial data:', error);
            return { groups: [], posts: [], templates: [], stats: {} };
        }
    }

    static async createPostWithTemplate(templateId, variables, scheduleTime) {
        try {
            // Получение шаблона
            const templates = await apiClient.getTemplates();
            const template = templates.find(t => t.id === templateId);
            
            if (!template) {
                throw new Error('Template not found');
            }

            // Заполнение шаблона переменными
            let content = template.content;
            for (const [key, value] of Object.entries(variables)) {
                content = content.replace(new RegExp(`{${key}}`, 'g'), value || '');
            }

            // Создание поста
            const postData = {
                group_id: variables.group_id,
                content: content,
                scheduled_time: scheduleTime,
                media_urls: variables.media_urls || ''
            };

            const result = await apiClient.createPost(postData);
            
            // Увеличение счетчика использования шаблона
            await apiClient.updateTemplate(templateId, {
                usage_count: (template.usage_count || 0) + 1
            });

            return result;
        } catch (error) {
            console.error('Failed to create post with template:', error);
            throw error;
        }
    }

    static formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString('ru-RU'),
            time: date.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            full: date.toLocaleString('ru-RU')
        };
    }

    static formatNumber(num) {
        return new Intl.NumberFormat('ru-RU').format(num);
    }

    static calculateEngagementRate(views, reactions = 0, forwards = 0) {
        if (views === 0) return 0;
        return ((reactions + forwards) / views * 100).toFixed(2);
    }

    static generateMockData() {
        return {
            groups: [
                {
                    id: 1,
                    chat_id: "-1001234567890",
                    name: "Tech News",
                    type: "channel",
                    status: "active",
                    autoposting: true,
                    post_frequency: 4,
                    members: 1250,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    chat_id: "-1000987654321",
                    name: "Crypto Community",
                    type: "supergroup",
                    status: "active",
                    autoposting: false,
                    post_frequency: 2,
                    members: 3400,
                    created_at: new Date().toISOString()
                }
            ],
            posts: [
                {
                    id: 1,
                    group_id: 1,
                    content: "🔥 Новые технологии в 2025 году...",
                    status: "published",
                    views_count: 1250,
                    published_time: new Date().toISOString(),
                    group_name: "Tech News"
                },
                {
                    id: 2,
                    group_id: 2,
                    content: "📈 Обзор рынка криптовалют...",
                    status: "scheduled",
                    scheduled_time: new Date(Date.now() + 3600000).toISOString(),
                    group_name: "Crypto Community"
                }
            ],
            templates: [
                {
                    id: 1,
                    name: "Новостной пост",
                    category: "news",
                    content: "🔥 {заголовок}\n\n{текст}\n\n#{теги}",
                    usage_count: 15,
                    created_at: new Date().toISOString()
                }
            ],
            stats: {
                total_groups: 2,
                total_posts: 45,
                scheduled_posts: 3,
                active_today: 5
            }
        };
    }
}

// Автоматическая загрузка данных при инициализации
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async function() {
        // Проверка доступности API
        const apiAvailable = await apiClient.healthCheck();
        
        if (apiAvailable) {
            console.log('API server is available');
            notify.success('Соединение с сервером установлено');
        } else {
            console.log('API server is not available, using mock data');
            notify.warning('Используются демонстрационные данные');
            
            // Загрузка моковых данных
            window.mockData = APIUtils.generateMockData();
        }
    });
}