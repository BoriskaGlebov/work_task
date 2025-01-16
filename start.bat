#!/bin/bash

# Путь к директории вашего Django приложения
APP_DIR="D:\SkillBox\work_task\lazy_ilya"

# Проверка существования директории
if [ ! -d "$APP_DIR" ]; then
    echo "Директория $APP_DIR не найдена!"
    exit 1
fi



# Создание виртуального окружения, если оно еще не создано
if [ ! -d "venv" ]; then
    echo "Создание виртуального окружения..."
    python -m venv venv
fi

# Активация виртуального окружения
echo "Активация виртуального окружения..."
source venv/Scripts/activate

# Установка зависимостей из requirements.txt
if [ -f requirements.txt ]; then
    echo "Установка зависимостей из requirements.txt..."
    pip install --upgrade pip  # Обновление pip до последней версии
    pip install -r requirements.txt  # Установка зависимостей
else
    echo "Файл requirements.txt не найден!"
    exit 1
fi
# Переход в директорию приложения
cd "$APP_DIR" || exit

# Запуск Django приложения
echo "Запуск Django приложения..."
python manage.py runserver  # Запуск сервера разработки Django
