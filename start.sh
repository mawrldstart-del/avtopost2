#!/bin/bash

# Telegram AutoPoster Bot Start Script
# Скрипт для запуска Telegram AutoPoster Bot

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка виртуального окружения
if [ -d "venv" ]; then
    print_info "Активация виртуального окружения..."
    source venv/bin/activate
fi

# Проверка наличия .env файла
if [ ! -f ".env" ]; then
    print_error "Файл .env не найден!"
    print_info "Скопируйте .env.example в .env и заполните необходимые данные"
    exit 1
fi

# Проверка токена в .env файле
if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
    print_error "Вы не настроили TELEGRAM_BOT_TOKEN в файле .env!"
    print_info "1. Получите токен у @BotFather в Telegram"
    print_info "2. Отредактируйте файл .env"
    print_info "3. Замените YOUR_BOT_TOKEN_HERE на ваш токен"
    exit 1
fi

# Проверка зависимостей
print_info "Проверка зависимостей..."
if ! python3 -c "import telegram" 2>/dev/null; then
    print_warning "Зависимости не найдены, установка..."
    pip3 install -r requirements.txt
fi

# Создание директорий если их нет
mkdir -p logs data media

# Очистка старых логов (опционально)
if [ -f "logs/bot.log" ]; then
    read -p "Очистить старые логи? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        > logs/bot.log
        print_success "Логи очищены"
    fi
fi

# Запуск бота
print_info "Запуск Telegram AutoPoster Bot..."
print_info "Логи будут записаны в: logs/bot.log"
print_info "Для остановки нажмите Ctrl+C"
print_info ""

# Запуск с логированием
python3 bot.py 2>&1 | tee logs/bot.log

# Альтернативный запуск (если нужен фоновый режим)
# nohup python3 bot.py > logs/bot.log 2>&1 &
# echo $! > bot.pid
# print_success "Бот запущен в фоновом режиме"
# print_info "PID: $(cat bot.pid)"
# print_info "Для остановки используйте: ./stop.sh"