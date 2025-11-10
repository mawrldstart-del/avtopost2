#!/bin/bash

# Telegram AutoPoster Bot Installation Script
# Этот скрипт автоматически установит и настроит Telegram AutoPoster Bot

set -e

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

# Проверка системы
check_system() {
    print_info "Проверка системы..."
    
    # Проверка Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 не установлен. Пожалуйста, установите Python 3.8 или выше."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    print_success "Python $PYTHON_VERSION найден"
    
    # Проверка pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 не установлен. Пожалуйста, установите pip."
        exit 1
    fi
    
    print_success "pip3 найден"
}

# Установка зависимостей
install_dependencies() {
    print_info "Установка зависимостей..."
    
    # Обновление pip
    pip3 install --upgrade pip
    
    # Установка пакетов из requirements.txt
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
        print_success "Зависимости установлены"
    else
        print_error "Файл requirements.txt не найден"
        exit 1
    fi
}

# Настройка конфигурации
setup_config() {
    print_info "Настройка конфигурации..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Файл .env создан. Пожалуйста, отредактируйте его и добавьте свой TELEGRAM_BOT_TOKEN"
        else
            print_error "Файл .env.example не найден"
            exit 1
        fi
    else
        print_success "Файл .env уже существует"
    fi
}

# Создание необходимых директорий
create_directories() {
    print_info "Создание директорий..."
    
    mkdir -p logs
    mkdir -p data
    mkdir -p media
    
    print_success "Директории созданы"
}

# Установка systemd service (для Linux)
install_service() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "Настройка systemd service..."
        
        # Определение пути к Python
        PYTHON_PATH=$(which python3)
        
        # Создание service файла
        cat > /tmp/autoposter.service << EOF
[Unit]
Description=Telegram AutoPoster Bot
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
ExecStart=$PYTHON_PATH bot.py
Restart=always
RestartSec=10
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
EOF
        
        sudo mv /tmp/autoposter.service /etc/systemd/system/
        sudo systemctl daemon-reload
        
        print_success "SystemD service создан"
        print_info "Для запуска используйте: sudo systemctl start autoposter"
        print_info "Для автозапуска: sudo systemctl enable autoposter"
    else
        print_warning "SystemD service доступен только для Linux"
    fi
}

# Создание скриптов запуска
create_scripts() {
    print_info "Создание скриптов запуска..."
    
    # Скрипт запуска
    cat > start.sh << 'EOF'
#!/bin/bash
# Telegram AutoPoster Bot Start Script

# Активация виртуального окружения (если есть)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Проверка переменных окружения
if [ ! -f ".env" ]; then
    echo "Ошибка: Файл .env не найден"
    echo "Скопируйте .env.example в .env и заполните необходимые данные"
    exit 1
fi

# Запуск бота
echo "Запуск Telegram AutoPoster Bot..."
python3 bot.py
EOF
    
    chmod +x start.sh
    
    # Скрипт для фонового запуска
    cat > start_background.sh << 'EOF'
#!/bin/bash
# Telegram AutoPoster Bot Background Start Script

# Активация виртуального окружения (если есть)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Запуск бота в фоновом режиме
nohup python3 bot.py > logs/bot.log 2>&1 &

# Сохранение PID
echo $! > bot.pid

echo "Бот запущен в фоновом режиме"
echo "PID: $!"
echo "Логи: logs/bot.log"
EOF
    
    chmod +x start_background.sh
    
    # Скрипт остановки
    cat > stop.sh << 'EOF'
#!/bin/bash
# Telegram AutoPoster Bot Stop Script

if [ -f "bot.pid" ]; then
    PID=$(cat bot.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "Бот остановлен"
        rm bot.pid
    else
        echo "Процесс не найден"
        rm -f bot.pid
    fi
else
    echo "PID файл не найден"
    echo "Используйте: pkill -f bot.py"
fi
EOF
    
    chmod +x stop.sh
    
    print_success "Скрипты запуска созданы"
}

# Проверка конфигурации
check_config() {
    print_info "Проверка конфигурации..."
    
    if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
        print_error "Вы не настроили TELEGRAM_BOT_TOKEN в файле .env"
        print_info "1. Получите токен у @BotFather в Telegram"
        print_info "2. Отредактируйте файл .env"
        print_info "3. Замените YOUR_BOT_TOKEN_HERE на ваш токен"
        exit 1
    fi
    
    print_success "Конфигурация проверена"
}

# Основная функция установки
main() {
    print_info "Начинаем установку Telegram AutoPoster Bot..."
    print_info "========================================="
    
    # Шаги установки
    check_system
    install_dependencies
    setup_config
    create_directories
    create_scripts
    check_config
    
    # Опционально: установка systemd service
    read -p "Установить systemd service (только для Linux)? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_service
    fi
    
    print_success "Установка завершена!"
    print_info "========================================="
    print_info "Дальнейшие шаги:"
    print_info "1. Отредактируйте файл .env и добавьте свой TELEGRAM_BOT_TOKEN"
    print_info "2. Запустите бота: ./start.sh"
    print_info "3. Откройте веб-интерфейс: https://2pz6b77t7jczs.ok.kimi.link"
    print_info ""
    print_info "Дополнительные команды:"
    print_info "- Фоновый запуск: ./start_background.sh"
    print_info "- Остановка: ./stop.sh"
    print_info "- Просмотр логов: tail -f logs/bot.log"
    
}

# Запуск установки
main "$@"