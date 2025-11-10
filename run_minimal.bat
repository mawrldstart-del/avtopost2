@echo off
color 0A
title Telegram AutoPoster - Minimal Mode
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              Telegram AutoPoster - Minimal Mode              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Проверка Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python не найден! Установите Python 3.8+ с https://python.org
    pause
    exit /b 1
)

:: Проверка .env файла
if not exist ".env" (
    echo ❌ Файл .env не найден
    pause
    exit /b 1
)

:: Проверка установки модуля telegram
python -c "from telegram import Bot" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Модуль telegram не найден
    echo [1] Попытка установки...
    python -m pip install python-telegram-bot --no-deps --timeout 600
    if %errorlevel% neq 0 (
        echo ❌ Не удалось установить модуль telegram
        echo Попробуйте: pip install python-telegram-bot
        pause
        exit /b 1
    )
)

:: Создание директорий
if not exist "logs" mkdir logs
if not exist "data" mkdir data

:: Запуск бота
echo.
echo 🚀 Запуск Telegram AutoPoster Bot (минимальный режим)...
echo 📋 Проверка конфигурации...
echo.

python bot_minimal.py

echo.
echo ✅ Работа завершена
pause