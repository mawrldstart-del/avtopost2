#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Telegram AutoPoster Bot - Minimal Version
Упрощенная версия для быстрого запуска
"""

import os
import sys
import asyncio
import logging
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/bot.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Попытка импорта telegram
try:
    from telegram import Bot
    from telegram.error import TelegramError
    print("✅ Telegram модуль загружен")
except ImportError as e:
    print(f"❌ Ошибка импорта telegram: {e}")
    print("Установите: pip install python-telegram-bot")
    sys.exit(1)

class MinimalTelegramBot:
    """Минимальная версия Telegram бота"""
    
    def __init__(self):
        self.token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not self.token or self.token == 'YOUR_BOT_TOKEN_HERE':
            logger.error("❌ TELEGRAM_BOT_TOKEN не настроен в .env файле")
            print("❌ Необходимо настроить TELEGRAM_BOT_TOKEN в файле .env")
            sys.exit(1)
            
        self.bot = Bot(self.token)
        self.admin_ids = os.getenv('ADMIN_IDS', '').split(',')
        
    async def start(self):
        """Запуск бота"""
        try:
            # Получение информации о боте
            me = await self.bot.get_me()
            logger.info(f"Бот запущен: {me.first_name} (@{me.username})")
            print(f"✅ Бот запущен: {me.first_name} (@{me.username})")
            
            # Отправка сообщения администраторам
            for admin_id in self.admin_ids:
                if admin_id.strip():
                    try:
                        await self.bot.send_message(
                            chat_id=admin_id.strip(),
                            text=f"🤖 Telegram AutoPoster Bot запущен!\n\n📅 Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n✅ Все системы работают нормально"
                        )
                        logger.info(f"Сообщение отправлено администратору {admin_id}")
                    except Exception as e:
                        logger.error(f"Ошибка отправки сообщения администратору {admin_id}: {e}")
            
            # Запуск основного цикла
            await self.run_forever()
            
        except TelegramError as e:
            logger.error(f"Telegram ошибка: {e}")
            print(f"❌ Ошибка Telegram: {e}")
        except Exception as e:
            logger.error(f"Неизвестная ошибка: {e}")
            print(f"❌ Неизвестная ошибка: {e}")
    
    async def run_forever(self):
        """Основной цикл работы бота"""
        print("🎯 Бот работает в минимальном режиме")
        print("💡 Для полной версии установите все зависимости")
        print("⏰ Для остановки нажмите Ctrl+C")
        
        try:
            while True:
                # Здесь будет логика бота
                await asyncio.sleep(60)  # Проверка каждую минуту
                logger.info("Бот работает нормально")
                
        except KeyboardInterrupt:
            logger.info("Бот остановлен пользователем")
            print("🛑 Бот остановлен")

async def main():
    """Главная функция"""
    bot = MinimalTelegramBot()
    await bot.start()

if __name__ == '__main__':
    print("🚀 Запуск Telegram AutoPoster Bot...")
    print("📋 Проверка конфигурации...")
    
    # Проверка .env файла
    if not os.path.exists('.env'):
        print("❌ Файл .env не найден")
        sys.exit(1)
    
    asyncio.run(main())