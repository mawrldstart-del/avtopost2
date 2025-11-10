@echo off
echo Установка Telegram AutoPoster Bot...

:: Создание виртуального окружения
python -m venv venv
call venv\Scripts\activate

:: Установка с увеличенным таймаутом
pip install --timeout 100 python-telegram-bot==20.7
pip install --timeout 100 aiohttp==3.9.1
pip install --timeout 100 APScheduler==3.10.4
pip install --timeout 100 requests==2.31.0
pip install --timeout 100 python-dotenv==1.0.0

echo Установка завершена!
pause