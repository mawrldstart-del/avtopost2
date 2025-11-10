#!/usr/bin/env python3
"""
Telegram AutoPoster Bot
Backend для автоматического постинга в Telegram группы и каналы
"""

import asyncio
import logging
import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters
from telegram.error import TelegramError
import aiohttp
from aiohttp import web
import uuid

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Конфигурация
@dataclass
class BotConfig:
    token: str
    admin_ids: List[int]
    database_path: str = 'autoposter.db'
    api_port: int = 8080
    webhook_url: Optional[str] = None
    
class DatabaseManager:
    """Управление базой данных"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Инициализация базы данных"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Таблица групп
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY,
                chat_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                autoposting BOOLEAN DEFAULT 0,
                post_frequency INTEGER DEFAULT 4,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица постов
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER,
                content TEXT NOT NULL,
                media_urls TEXT,
                status TEXT DEFAULT 'scheduled',
                scheduled_time TIMESTAMP,
                published_time TIMESTAMP,
                views_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups (id)
            )
        ''')
        
        # Таблица шаблонов
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                content TEXT NOT NULL,
                variables TEXT,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица статистики
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER,
                post_id INTEGER,
                metric_type TEXT NOT NULL,
                metric_value REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES groups (id),
                FOREIGN KEY (post_id) REFERENCES posts (id)
            )
        ''')
        
        # Таблица настроек
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """Выполнение SELECT запроса"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results
    
    def execute_update(self, query: str, params: tuple = None) -> int:
        """Выполнение INSERT/UPDATE/DELETE запроса"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        conn.commit()
        row_id = cursor.lastrowid
        conn.close()
        return row_id

@dataclass
class Group:
    """Модель группы/канала"""
    id: int = None
    chat_id: str = ""
    name: str = ""
    type: str = "group"
    status: str = "active"
    autoposting: bool = False
    post_frequency: int = 4
    created_at: str = ""
    updated_at: str = ""

@dataclass
class Post:
    """Модель поста"""
    id: int = None
    group_id: int = 0
    content: str = ""
    media_urls: str = ""
    status: str = "scheduled"
    scheduled_time: str = ""
    published_time: str = ""
    views_count: int = 0
    created_at: str = ""

@dataclass
class Template:
    """Модель шаблона"""
    id: int = None
    name: str = ""
    category: str = ""
    content: str = ""
    variables: str = ""
    usage_count: int = 0
    created_at: str = ""

class TelegramAutoPoster:
    """Основной класс Telegram AutoPoster Bot"""
    
    def __init__(self, config: BotConfig):
        self.config = config
        self.db = DatabaseManager(config.database_path)
        self.bot = Bot(config.token)
        self.application = Application.builder().token(config.token).build()
        self.scheduler = AsyncIOScheduler()
        self.setup_handlers()
        
    def setup_handlers(self):
        """Настройка обработчиков команд"""
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("stats", self.stats_command))
        self.application.add_handler(CommandHandler("groups", self.groups_command))
        self.application.add_handler(CallbackQueryHandler(self.button_callback))
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
    
    async def start_command(self, update: Update, context):
        """Команда /start"""
        user = update.effective_user
        welcome_text = f"""
🤖 Привет, {user.first_name}!

Я Telegram AutoPoster Bot - ваш помощник для автоматического постинга в группы и каналы.

Возможности:
📱 Управление группами через веб-интерфейс
📊 Аналитика и статистика постов
📝 Создание и планирование постов
🎨 Использование шаблонов
⚡ Автоматическая публикация

Используйте /help для просмотра доступных команд.
        """
        
        keyboard = [
            [InlineKeyboardButton("📊 Статистика", callback_data="stats")],
            [InlineKeyboardButton("👥 Мои группы", callback_data="groups")],
            [InlineKeyboardButton("📝 Создать пост", callback_data="create_post")],
            [InlineKeyboardButton("🌐 Веб-интерфейс", url="https://2pz6b77t7jczs.ok.kimi.link")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(welcome_text, reply_markup=reply_markup)
    
    async def help_command(self, update: Update, context):
        """Команда /help"""
        help_text = """
📋 Доступные команды:

/start - Начало работы с ботом
/help - Показать это сообщение
/stats - Показать статистику
/groups - Управление группами

🌐 Основной интерфейс:
Веб-приложение: https://2pz6b77t7jczs.ok.kimi.link

Через веб-интерфейс вы можете:
• Добавлять и управлять группами
• Создавать и планировать посты
• Просматривать аналитику
• Использовать шаблоны
• Настраивать автопостинг
        """
        await update.message.reply_text(help_text)
    
    async def stats_command(self, update: Update, context):
        """Команда /stats - показ статистики"""
        try:
            # Получение статистики из базы данных
            total_groups = self.db.execute_query("SELECT COUNT(*) as count FROM groups WHERE status = 'active'")[0]['count']
            total_posts = self.db.execute_query("SELECT COUNT(*) as count FROM posts WHERE status = 'published'")[0]['count']
            scheduled_posts = self.db.execute_query("SELECT COUNT(*) as count FROM posts WHERE status = 'scheduled'")[0]['count']
            
            stats_text = f"""
📊 Статистика AutoPoster:

👥 Активных групп: {total_groups}
📄 Опубликовано постов: {total_posts}
⏳ Запланировано постов: {scheduled_posts}

🌐 Полная статистика доступна в веб-интерфейсе:
https://2pz6b77t7jczs.ok.kimi.link
            """
            
            await update.message.reply_text(stats_text)
            
        except Exception as e:
            logger.error(f"Error in stats_command: {e}")
            await update.message.reply_text("❌ Ошибка при получении статистики")
    
    async def groups_command(self, update: Update, context):
        """Команда /groups - управление группами"""
        try:
            groups = self.db.execute_query("SELECT id, name, type, status FROM groups ORDER BY name")
            
            if not groups:
                await update.message.reply_text("У вас еще нет добавленных групп. Добавьте их через веб-интерфейс.")
                return
            
            groups_text = "👥 Ваши группы:\n\n"
            for group in groups:
                status_emoji = "✅" if group['status'] == 'active' else "❌"
                groups_text += f"{status_emoji} {group['name']} ({group['type']})\n"
            
            groups_text += "\n🌐 Управляйте группами в веб-интерфейсе:\nhttps://2pz6b77t7jczs.ok.kimi.link"
            
            await update.message.reply_text(groups_text)
            
        except Exception as e:
            logger.error(f"Error in groups_command: {e}")
            await update.message.reply_text("❌ Ошибка при получении списка групп")
    
    async def button_callback(self, update: Update, context):
        """Обработка нажатий на inline кнопки"""
        query = update.callback_query
        await query.answer()
        
        if query.data == "stats":
            await self.stats_command(update, context)
        elif query.data == "groups":
            await self.groups_command(update, context)
        elif query.data == "create_post":
            await query.edit_message_text("📝 Создание постов доступно в веб-интерфейсе:\nhttps://2pz6b77t7jczs.ok.kimi.link")
    
    async def handle_message(self, update: Update, context):
        """Обработка текстовых сообщений"""
        # Этот обработчик можно использовать для дополнительных функций
        pass
    
    async def publish_post(self, post: Post, group: Group):
        """Публикация поста в группу"""
        try:
            # Публикация сообщения
            message = await self.bot.send_message(
                chat_id=group.chat_id,
                text=post.content,
                parse_mode='HTML'
            )
            
            # Обновление статуса поста
            self.db.execute_update(
                "UPDATE posts SET status = 'published', published_time = ? WHERE id = ?",
                (datetime.now().isoformat(), post.id)
            )
            
            # Запись статистики
            self.db.execute_update(
                "INSERT INTO statistics (group_id, post_id, metric_type, metric_value) VALUES (?, ?, 'views', ?)",
                (group.id, post.id, 0)
            )
            
            logger.info(f"Post {post.id} published to group {group.name}")
            return True
            
        except TelegramError as e:
            logger.error(f"Telegram error publishing post {post.id}: {e}")
            # Обновление статуса на ошибку
            self.db.execute_update(
                "UPDATE posts SET status = 'error' WHERE id = ?",
                (post.id,)
            )
            return False
    
    async def check_and_publish_scheduled_posts(self):
        """Проверка и публикация запланированных постов"""
        try:
            current_time = datetime.now()
            
            # Получение постов для публикации
            posts_query = """
                SELECT p.*, g.chat_id, g.name as group_name, g.status as group_status 
                FROM posts p 
                JOIN groups g ON p.group_id = g.id 
                WHERE p.status = 'scheduled' 
                AND p.scheduled_time <= ?
                AND g.status = 'active'
            """
            
            posts_data = self.db.execute_query(posts_query, (current_time.isoformat(),))
            
            for post_data in posts_data:
                post = Post(**post_data)
                group = Group(
                    id=post_data['group_id'],
                    chat_id=post_data['chat_id'],
                    name=post_data['group_name'],
                    status=post_data['group_status']
                )
                
                await self.publish_post(post, group)
                
        except Exception as e:
            logger.error(f"Error checking scheduled posts: {e}")
    
    def setup_scheduler(self):
        """Настройка планировщика задач"""
        # Проверка постов каждую минуту
        self.scheduler.add_job(
            self.check_and_publish_scheduled_posts,
            trigger=CronTrigger(minute='*'),
            id='check_posts',
            replace_existing=True
        )
        
        self.scheduler.start()
        logger.info("Scheduler started")
    
    async def run_bot(self):
        """Запуск бота"""
        try:
            # Настройка планировщика
            self.setup_scheduler()
            
            # Запуск бота
            await self.application.initialize()
            await self.application.start()
            
            logger.info("Bot started successfully")
            
            # Ожидание
            await self.application.updater.start_polling()
            
        except Exception as e:
            logger.error(f"Error running bot: {e}")
            raise

class WebAPIServer:
    """Web API сервер для взаимодействия с frontend"""
    
    def __init__(self, bot_instance: TelegramAutoPoster, port: int = 8080):
        self.bot = bot_instance
        self.port = port
        self.app = web.Application()
        self.setup_routes()
    
    def setup_routes(self):
        """Настройка маршрутов API"""
        self.app.router.add_get('/api/health', self.health_check)
        self.app.router.add_get('/api/stats', self.get_stats)
        self.app.router.add_get('/api/groups', self.get_groups)
        self.app.router.add_post('/api/groups', self.add_group)
        self.app.router.add_post('/api/posts', self.create_post)
        self.app.router.add_get('/api/posts', self.get_posts)
        self.app.router.add_get('/api/templates', self.get_templates)
        self.app.router.add_post('/api/templates', self.create_template)
        self.app.router.add_post('/api/export', self.export_data)
    
    async def health_check(self, request):
        """Проверка состояния сервера"""
        return web.json_response({
            'status': 'ok',
            'bot_running': True,
            'timestamp': datetime.now().isoformat()
        })
    
    async def get_stats(self, request):
        """Получение статистики"""
        try:
            stats = {
                'total_groups': self.bot.db.execute_query("SELECT COUNT(*) as count FROM groups WHERE status = 'active'")[0]['count'],
                'total_posts': self.bot.db.execute_query("SELECT COUNT(*) as count FROM posts WHERE status = 'published'")[0]['count'],
                'scheduled_posts': self.bot.db.execute_query("SELECT COUNT(*) as count FROM posts WHERE status = 'scheduled'")[0]['count'],
                'active_today': self.bot.db.execute_query("SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = DATE('now')")[0]['count']
            }
            return web.json_response(stats)
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def get_groups(self, request):
        """Получение списка групп"""
        try:
            groups = self.bot.db.execute_query("SELECT * FROM groups ORDER BY name")
            return web.json_response(groups)
        except Exception as e:
            logger.error(f"Error getting groups: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def add_group(self, request):
        """Добавление новой группы"""
        try:
            data = await request.json()
            
            # Проверка обязательных полей
            required_fields = ['chat_id', 'name', 'type']
            for field in required_fields:
                if field not in data:
                    return web.json_response({'error': f'Missing required field: {field}'}, status=400)
            
            # Проверка существования группы
            existing = self.bot.db.execute_query(
                "SELECT id FROM groups WHERE chat_id = ?",
                (data['chat_id'],)
            )
            
            if existing:
                return web.json_response({'error': 'Group already exists'}, status=400)
            
            # Добавление группы
            group_id = self.bot.db.execute_update(
                """INSERT INTO groups (chat_id, name, type, autoposting, post_frequency) 
                   VALUES (?, ?, ?, ?, ?)""",
                (data['chat_id'], data['name'], data['type'], 
                 data.get('autoposting', False), data.get('post_frequency', 4))
            )
            
            return web.json_response({
                'success': True,
                'group_id': group_id,
                'message': 'Group added successfully'
            })
            
        except Exception as e:
            logger.error(f"Error adding group: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def create_post(self, request):
        """Создание нового поста"""
        try:
            data = await request.json()
            
            # Проверка обязательных полей
            required_fields = ['group_id', 'content', 'scheduled_time']
            for field in required_fields:
                if field not in data:
                    return web.json_response({'error': f'Missing required field: {field}'}, status=400)
            
            # Добавление поста
            post_id = self.bot.db.execute_update(
                """INSERT INTO posts (group_id, content, media_urls, scheduled_time) 
                   VALUES (?, ?, ?, ?)""",
                (data['group_id'], data['content'], 
                 data.get('media_urls', ''), data['scheduled_time'])
            )
            
            return web.json_response({
                'success': True,
                'post_id': post_id,
                'message': 'Post created successfully'
            })
            
        except Exception as e:
            logger.error(f"Error creating post: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def get_posts(self, request):
        """Получение списка постов"""
        try:
            status = request.rel_url.query.get('status', 'all')
            
            if status == 'all':
                posts = self.bot.db.execute_query("""
                    SELECT p.*, g.name as group_name 
                    FROM posts p 
                    JOIN groups g ON p.group_id = g.id 
                    ORDER BY p.created_at DESC
                """)
            else:
                posts = self.bot.db.execute_query("""
                    SELECT p.*, g.name as group_name 
                    FROM posts p 
                    JOIN groups g ON p.group_id = g.id 
                    WHERE p.status = ?
                    ORDER BY p.created_at DESC
                """, (status,))
            
            return web.json_response(posts)
        except Exception as e:
            logger.error(f"Error getting posts: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def get_templates(self, request):
        """Получение списка шаблонов"""
        try:
            templates = self.bot.db.execute_query("SELECT * FROM templates ORDER BY name")
            return web.json_response(templates)
        except Exception as e:
            logger.error(f"Error getting templates: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def create_template(self, request):
        """Создание нового шаблона"""
        try:
            data = await request.json()
            
            # Проверка обязательных полей
            required_fields = ['name', 'category', 'content']
            for field in required_fields:
                if field not in data:
                    return web.json_response({'error': f'Missing required field: {field}'}, status=400)
            
            # Добавление шаблона
            template_id = self.bot.db.execute_update(
                """INSERT INTO templates (name, category, content, variables) 
                   VALUES (?, ?, ?, ?)""",
                (data['name'], data['category'], data['content'], 
                 data.get('variables', ''))
            )
            
            return web.json_response({
                'success': True,
                'template_id': template_id,
                'message': 'Template created successfully'
            })
            
        except Exception as e:
            logger.error(f"Error creating template: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def export_data(self, request):
        """Экспорт данных"""
        try:
            data = {
                'groups': self.bot.db.execute_query("SELECT * FROM groups"),
                'posts': self.bot.db.execute_query("SELECT * FROM posts"),
                'templates': self.bot.db.execute_query("SELECT * FROM templates"),
                'statistics': self.bot.db.execute_query("SELECT * FROM statistics"),
                'export_time': datetime.now().isoformat()
            }
            
            return web.json_response(data)
        except Exception as e:
            logger.error(f"Error exporting data: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def run(self):
        """Запуск Web API сервера"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        logger.info(f"Web API server started on port {self.port}")

async def main():
    """Главная функция"""
    # Загрузка конфигурации
    config = BotConfig(
        token=os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE'),
        admin_ids=[int(id) for id in os.getenv('ADMIN_IDS', '123456789').split(',')],
        api_port=int(os.getenv('API_PORT', '8080'))
    )
    
    # Проверка токена
    if config.token == 'YOUR_BOT_TOKEN_HERE':
        logger.error("Please set TELEGRAM_BOT_TOKEN environment variable")
        return
    
    # Создание экземпляра бота
    bot = TelegramAutoPoster(config)
    
    # Создание Web API сервера
    api_server = WebAPIServer(bot, config.api_port)
    
    # Запуск всех компонентов
    try:
        await asyncio.gather(
            bot.run_bot(),
            api_server.run()
        )
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")

if __name__ == '__main__':
    asyncio.run(main())