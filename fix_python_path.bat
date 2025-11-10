@echo off
echo Исправление пути к Python...

:: Найти правильный путь к Python
where python > python_path.txt
for /f %%i in (python_path.txt) do set PYTHON_PATH=%%i
echo Найден Python: %PYTHON_PATH%

:: Установить переменную окружения
setx PATH "%PATH%;%PYTHON_PATH%" >nul 2>&1

:: Проверить pip
where pip >nul 2>&1
if %errorlevel% neq 0 (
    echo Установка pip...
    python -m ensurepip --upgrade
)

echo Готово!
pause