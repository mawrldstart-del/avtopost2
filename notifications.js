// Система уведомлений для Telegram AutoPoster
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
        this.loadNotifications();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Автоматическое удаление
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        const colors = this.getTypeColors(type);
        
        notification.className = `notification-item transform translate-x-full transition-all duration-300 ease-out ${colors.bg} ${colors.text} px-4 py-3 rounded-lg shadow-lg max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <div class="mr-3">
                        ${this.getTypeIcon(type)}
                    </div>
                    <div class="text-sm font-medium">${message}</div>
                </div>
                <button onclick="notificationSystem.remove(this.closest('.notification-item'))" 
                        class="ml-4 text-current opacity-70 hover:opacity-100">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        return notification;
    }

    getTypeColors(type) {
        const colors = {
            success: { bg: 'bg-green-600', text: 'text-white' },
            error: { bg: 'bg-red-600', text: 'text-white' },
            warning: { bg: 'bg-yellow-600', text: 'text-white' },
            info: { bg: 'bg-blue-600', text: 'text-white' },
            default: { bg: 'bg-gray-600', text: 'text-white' }
        };
        return colors[type] || colors.default;
    }

    getTypeIcon(type) {
        const icons = {
            success: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
            error: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
            warning: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            info: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    remove(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }

    loadNotifications() {
        // Загрузка сохраненных уведомлений из localStorage
        const saved = localStorage.getItem('telegram-autoposter-notifications');
        if (saved) {
            try {
                const notifications = JSON.parse(saved);
                notifications.forEach(n => this.show(n.message, n.type, 3000));
            } catch (e) {
                console.error('Failed to load notifications:', e);
            }
        }
    }

    saveNotifications() {
        // Сохранение уведомлений в localStorage
        const notifications = this.notifications.map(n => ({
            message: n.querySelector('.text-sm').textContent,
            type: n.className.includes('green') ? 'success' : 
                  n.className.includes('red') ? 'error' :
                  n.className.includes('yellow') ? 'warning' : 'info'
        }));
        
        localStorage.setItem('telegram-autoposter-notifications', JSON.stringify(notifications));
    }
}

// Глобальный экземпляр системы уведомлений
const notificationSystem = new NotificationSystem();

// Утилиты для быстрого показа уведомлений
const notify = {
    success: (message, duration = 5000) => notificationSystem.show(message, 'success', duration),
    error: (message, duration = 5000) => notificationSystem.show(message, 'error', duration),
    warning: (message, duration = 5000) => notificationSystem.show(message, 'warning', duration),
    info: (message, duration = 5000) => notificationSystem.show(message, 'info', duration)
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationSystem, notify };
}