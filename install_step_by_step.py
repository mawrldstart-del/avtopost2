import subprocess
import sys
import time

packages = [
    ("python-telegram-bot", "20.7"),
    ("aiohttp", "3.9.1"), 
    ("APScheduler", "3.10.4"),
    ("requests", "2.31.0"),
    ("python-dotenv", "1.0.0")
]

print("Начинаем установку пакетов...")

for package, version in packages:
    full_package = f"{package}=={version}"
    print(f"\n📦 Установка {full_package}...")
    
    try:
        # Попытка установки
        result = subprocess.run([
            sys.executable, "-m", "pip", "install",
            "--timeout", "600",  # 10 минут
            "--retries", "20",   # 20 попыток
            "--no-cache-dir",
            "--disable-pip-version-check",
            full_package
        ], capture_output=True, text=True, timeout=900)  # 15 минут общее время
        
        if result.returncode == 0:
            print(f"✅ {package} успешно установлен")
        else:
            print(f"❌ Ошибка установки {package}")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            
            # Пробуем установить без указания версии
            print(f"Попытка установить {package} без указания версии...")
            result = subprocess.run([
                sys.executable, "-m", "pip", "install",
                "--timeout", "600",
                package
            ], capture_output=True, text=True, timeout=600)
            
            if result.returncode == 0:
                print(f"✅ {package} установлен (последняя версия)")
            else:
                print(f"❌ {package} не удалось установить")
                print("Пропускаем этот пакет и продолжаем...")
    
    except subprocess.TimeoutExpired:
        print(f"⏰ Таймаут при установке {package}")
        print("Пропускаем и продолжаем...")
    except Exception as e:
        print(f"🚨 Исключение при установке {package}: {e}")
        print("Пропускаем и продолжаем...")

print("\n🎉 Установка завершена!")
print("Проверьте вывод выше на наличие ошибок.")