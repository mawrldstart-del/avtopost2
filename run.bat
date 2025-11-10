@echo off
setlocal EnableExtensions
color 0A
title Telegram AutoPoster Bot - Windows Launcher
chcp 65001 >nul
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%"

cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    Telegram AutoPoster Bot                   ║
echo ║                     Windows Launcher v2.0                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo [1] Проверка Python...
where python >nul 2>&1
if errorlevel 1 goto no_python
for /f %%i in ('where python') do set "PYTHON_PATH=%%i"
echo ✅ Python найден: %PYTHON_PATH%

echo.
echo [2] Проверка виртуального окружения...
if exist "venv\Scripts\python.exe" (
    echo ✅ Виртуальное окружение найдено
) else (
    echo ⚙️  Создание виртуального окружения...
    %PYTHON_PATH% -m venv venv
    if errorlevel 1 goto venv_error
    echo ✅ Виртуальное окружение создано
)
call "venv\Scripts\activate"

set "PYTHON_BIN=%SCRIPT_DIR%venv\Scripts\python.exe"
if not exist "%PYTHON_BIN%" set "PYTHON_BIN=python"

if exist "requirements.txt" (
    echo.
    echo [3] Обновление зависимостей...
    "%PYTHON_BIN%" -m pip install --upgrade pip --quiet
    if errorlevel 1 goto pip_error
    "%PYTHON_BIN%" -m pip install -r requirements.txt --disable-pip-version-check --quiet
    if errorlevel 1 goto pip_error
)

echo.
echo [4] Проверка файла .env...
if exist ".env" (
    echo ✅ Найден .env
) else (
    echo ❌ Файл .env не найден. Добавьте конфигурацию рядом с run.bat
    goto exit_fail
)

echo.
echo [5] Запуск Telegram AutoPoster Bot...
if not exist "logs" mkdir logs >nul 2>&1

where powershell >nul 2>&1
if %errorlevel%==0 (
    powershell -NoProfile -Command "\"%PYTHON_BIN%\" '%SCRIPT_DIR%bot.py' 2>&1 ^| Tee-Object -FilePath '%SCRIPT_DIR%logs\bot.log'"
) else (
    "%PYTHON_BIN%" "%SCRIPT_DIR%bot.py" >> "logs\bot.log" 2>&1
)
set "EXIT_CODE=%ERRORLEVEL%"

if "%EXIT_CODE%"=="0" (
    echo ✅ Бот завершил работу.
) else (
    echo ❌ Бот завершился с кодом %EXIT_CODE%.
)

goto cleanup

:no_python
echo ❌ Python не найден! Установите Python 3.8+ с https://python.org
set "EXIT_CODE=1"
goto cleanup

:venv_error
echo ❌ Не удалось создать виртуальное окружение.
set "EXIT_CODE=1"
goto cleanup

:exit_fail
set "EXIT_CODE=1"
goto cleanup

:pip_error
echo ❌ Не удалось установить зависимости. Выполните вручную: pip install -r requirements.txt
set "EXIT_CODE=1"
goto cleanup

:cleanup
popd
endlocal & exit /b %EXIT_CODE%
