#!/bin/bash

# Telegram AutoPoster Bot Stop Script
# Скрипт для остановки Telegram AutoPoster Bot

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

# Функция для безопасной остановки процесса
stop_process() {
    local pid=$1
    local name=$2
    
    if kill -0 $pid 2>/dev/null; then
        print_info "Остановка $name (PID: $pid)..."
        
        # Попытка graceful shutdown
        kill $pid
        
        # Ждем 5 секунд
        local count=0
        while kill -0 $pid 2>/dev/null && [ $count -lt 5 ]; do
            sleep 1
            ((count++))
        done
        
        # Если процесс все еще работает, принудительное завершение
        if kill -0 $pid 2>/dev/null; then
            print_warning "Принудительное завершение $name..."
            kill -9 $pid
        fi
        
        print_success "$name остановлен"
    else
        print_warning "$name (PID: $pid) не работает"
    fi
}

# Проверка PID файла
if [ -f "bot.pid" ]; then
    PID=$(cat bot.pid)
    print_info "Найден PID файл с ID: $PID"
    
    stop_process $PID "Telegram AutoPoster Bot"
    rm -f bot.pid
    
else
    print_info "PID файл не найден, поиск процессов..."
    
    # Поиск процессов Python с bot.py
    PYTHON_PROCESSES=$(pgrep -f "bot.py" || echo "")
    
    if [ -n "$PYTHON_PROCESSES" ]; then
        print_info "Найдены процессы bot.py: $PYTHON_PROCESSES"
        
        for pid in $PYTHON_PROCESSES; do
            stop_process $pid "Telegram AutoPoster Bot"
        done
    else
        print_warning "Процессы bot.py не найдены"
    fi
fi

# Проверка systemd service (для Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if systemctl is-active --quiet autoposter 2>/dev/null; then
        print_info "Остановка systemd service autoposter..."
        sudo systemctl stop autoposter
        print_success "SystemD service autoposter остановлен"
    fi
fi

# Проверка Docker контейнеров
if command -v docker &> /dev/null; then
    CONTAINERS=$(docker ps -q --filter "name=telegram-autoposter" 2>/dev/null || echo "")
    if [ -n "$CONTAINERS" ]; then
        print_info "Остановка Docker контейнеров..."
        docker stop $CONTAINERS
        print_success "Docker контейнеры остановлены"
    fi
fi

print_success "Остановка завершена"
print_info ""
print_info "Для запуска используйте: ./start.sh"