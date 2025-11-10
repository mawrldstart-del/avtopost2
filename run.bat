@echo off
color 0A
title Telegram AutoPoster Bot - Windows Launcher
chcp 65001 >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Telegram AutoPoster Bot                   ║
echo ║                     Windows Launcher v1.0                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Проверка и создание requirements.txt
if not exist "requirements.txt" (
    echo [0] Создание requirements.txt...
    (
        echo python-telegram-bot==20.7
        echo aiohttp==3.9.1
        echo APScheduler==3.10.4
        echo requests==2.31.0
        echo python-dotenv==1.0.0
    ) > requirements.txt
    echo ✅ requirements.txt создан
)

:: Проверка Python
echo [1] Проверка Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python не найден! Установите Python 3.8+ с https://python.org
    echo.
    pause
    exit /b 1
)
for /f %%i in ('where python') do set PYTHON_PATH=%%i
echo ✅ Python найден: %PYTHON_PATH%

:: Проверка pip
where pip >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  pip не найден, установка...
    %PYTHON_PATH% -m ensurepip --upgrade
)

:: Проверка виртуального окружения
echo.
echo [2] Проверка виртуального окружения...
if exist "venv" (
    echo ✅ Виртуальное окружение найдено
    call venv\Scripts\activate
) else (
    echo ⚠️  Виртуальное окружение не найдено
    echo [2.1] Создание виртуального окружения...
    %PYTHON_PATH% -m venv venv
    if %errorlevel% neq 0 (
        echo ❌ Ошибка создания виртуального окружения
        pause
        exit /b 1
    )
    echo ✅ Виртуальное окружение создано
    call venv\Scripts\activate
)

:: Установка зависимостей
echo.
echo [3] Проверка зависимостей...
if exist "requirements.txt" (
    echo ✅ Файл requirements.txt найден
    echo [3.1] Установка зависимостей...
    pip install --upgrade pip
    pip install -r requirements.txt --timeout 300 --retries 5
    if %errorlevel% neq 0 (
        echo ⚠️  Ошибка установки некоторых зависимостей
        echo [3.2] Попытка установки основных модулей...
        pip install python-telegram-bot==20.7 --timeout 300
        pip install aiohttp==3.9.1 --timeout 300
        pip install APScheduler==3.10.4 --timeout 300
        pip install requests==2.31.0 --timeout 300
        pip install python-dotenv==1.0.0 --timeout 300
    )
) else (
    echo ❌ Файл requirements.txt не найден
    echo [3.1] Установка основных модулей...
    pip install python-telegram-bot aiohttp APScheduler requests python-dotenv --timeout 300
)

:: Проверка .env файла
echo.
echo [4] Проверка конфигурации...
if exist ".env" (
    echo ✅ Файл конфигурации найден
    echo [4.1] Проверка токена...
    findstr "YOUR_BOT_TOKEN_HERE" .env >nul
    if %errorlevel% equ 0 (
        echo ❌ Токен бота не настроен!
        echo.
        echo ⚠️  ВАЖНО: Отредактируйте файл .env и добавьте свой TELEGRAM_BOT_TOKEN
        echo Получите токен у @BotFather в Telegram
        echo.
        notepad .env
        pause
        exit /b 1
    ) else (
        echo ✅ Токен бота настроен
    )
) else (
    echo ⚠️  Файл конфигурации не найден
    echo [4.1] Создание файла конфигурации...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo ✅ Файл конфигурации создан из .env.example
        echo ❌ Необходимо настроить TELEGRAM_BOT_TOKEN в файле .env
        notepad .env
        pause
        exit /b 1
    ) else (
        echo [4.2] Создание файла конфигурации с шаблоном...
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
)

:: Создание директорий
echo.
echo [5] Подготовка директорий...
if not exist "logs" mkdir logs
if not exist "data" mkdir data
if not exist "media" mkdir media
echo ✅ Директории созданы

:: Запуск бота
echo.
echo [6] Запуск Telegram AutoPoster Bot...
echo.
echo 🔄 Запуск бота...
echo Логи будут записаны в: logs/bot.log
echo Для остановки нажмите Ctrl+C
echo.

:: Запуск с логированием
python bot.py 2>&1 | tee logs/bot.log

:: Если бот остановлен, показать меню
echo.
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Бот остановлен                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Выберите действие:
echo [1] Перезапустить бота
echo [2] Открыть веб-интерфейс
echo [3] Просмотреть логи
echo [4] Выход
echo.

set /p choice="Ваш выбор (1-4): "

if "%choice%"=="1" goto restart
if "%choice%"=="2" goto webinterface
if "%choice%"=="3" goto logs
if "%choice%"=="4" goto exit

:restart
echo.
echo Перезапуск бота...
goto run

:webinterface
echo.
echo Открытие веб-интерфейса...
start https://2pz6b77t7jczs.ok.kimi.link
pause
goto menu

:logs
echo.
echo Просмотр логов (нажмите Ctrl+C для выхода)...
more logs/bot.log
pause
goto menu

:exit
echo.
echo Спасибо за использование Telegram AutoPoster Bot! 👋
pause
exit /b 0

:menu
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Главное меню                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [1] Запустить бота
echo [2] Открыть веб-интерфейс
echo [3] Просмотреть логи
echo [4] Выход
echo.

set /p choice="Ваш выбор (1-4): "

if "%choice%"=="1" goto run
if "%choice%"=="2" goto webinterface
if "%choice%"=="3" goto logs
if "%choice%"=="4" goto exit

goto menu

:run
:: Очистка экрана и возврат к началу
cls
goto start