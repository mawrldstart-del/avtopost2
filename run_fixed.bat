@echo off
color 0A
title Telegram AutoPoster Bot - Fixed Launcher
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Telegram AutoPoster Bot                   ║
echo ║                  Fixed Launcher for Python 3.11              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Определение пути к Python
set PYTHON_PATH=C:\Program Files\Python311\python.exe

:: Проверка Python
echo [1] Проверка Python...
if exist "%PYTHON_PATH%" (
    echo ✅ Python найден: %PYTHON_PATH%
) else (
    echo ❌ Python не найден по пути: %PYTHON_PATH%
    echo Попытка найти Python в системе...
    where python >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python не найден в системе!
        pause
        exit /b 1
    ) else (
        for /f %%i in ('where python') do set PYTHON_PATH=%%i
        echo ✅ Найден Python: %PYTHON_PATH%
    )
)

:: Обновление pip
echo.
echo [2] Обновление pip...
"%PYTHON_PATH%" -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo ⚠️  Ошибка обновления pip, продолжаем...
)

:: Создание requirements.txt если не существует
if not exist "requirements.txt" (
    echo [3] Создание requirements.txt...
    (
        echo python-telegram-bot==20.7
        echo aiohttp==3.9.1
        echo APScheduler==3.10.4
        echo requests==2.31.0
        echo python-dotenv==1.0.0
    ) > requirements.txt
    echo ✅ requirements.txt создан
)

:: Установка зависимостей
echo.
echo [4] Установка зависимостей...
"%PYTHON_PATH%" -m pip install -r requirements.txt --timeout 300 --retries 5
if %errorlevel% neq 0 (
    echo ⚠️  Ошибка установки через requirements.txt
    echo [4.1] Попытка установки по одному...
    "%PYTHON_PATH%" -m pip install python-telegram-bot==20.7 --timeout 300
    "%PYTHON_PATH%" -m pip install APScheduler==3.10.4 --timeout 300
    "%PYTHON_PATH%" -m pip install requests==2.31.0 --timeout 300
    "%PYTHON_PATH%" -m pip install python-dotenv==1.0.0 --timeout 300
    "%PYTHON_PATH%" -m pip install aiohttp==3.9.1 --timeout 300
)

:: Проверка .env файла
echo.
echo [5] Проверка конфигурации...
if exist ".env" (
    echo ✅ Файл конфигурации найден
) else (
    echo ⚠️  Файл конфигурации не найден
    echo [5.1] Создание файла конфигурации...
    (
        echo # Telegram Bot Token (обязательно)
        echo TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
        echo.
        echo # ID администраторов (через запятую)
        echo ADMIN_IDS=123456789
        echo.
        echo # Порт для API сервера
        echo API_PORT=8080
        echo.
        echo # Database settings
        echo DATABASE_PATH=autoposter.db
        echo.
        echo # Logging level
        echo LOG_LEVEL=INFO
    ) > .env
    echo ✅ Файл конфигурации создан
    echo ❌ Необходимо настроить TELEGRAM_BOT_TOKEN в файле .env
    notepad .env
    pause
    exit /b 1
)

:: Создание директорий
echo.
echo [6] Подготовка директорий...
if not exist "logs" mkdir logs
if not exist "data" mkdir data
if not exist "media" mkdir media
echo ✅ Директории созданы

:: Проверка установки модулей
echo.
echo [7] Проверка модулей...
"%PYTHON_PATH%" -c "import telegram; print('✅ Telegram модуль найден')" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Модули не установлены
    pause
    exit /b 1
)

:: Запуск бота
echo.
echo [8] Запуск Telegram AutoPoster Bot...
echo.
echo 🔄 Запуск бота...
echo Логи будут записаны в: logs/bot.log
echo Для остановки нажмите Ctrl+C
echo.

:: Запуск с логированием
"%PYTHON_PATH%" bot.py 2>&1 | tee logs/bot.log

echo.
echo ✅ Бот остановлен
pause