#!/bin/sh

# Переход в директорию с manage.py
cd /work_task/lazy_ilya/

echo "🟡 Выполняем миграции..."
python manage.py migrate

echo "🔧 Запускаем кастомную команду start_deploy..."
python manage.py start_deploy

echo "🚀 Запускаем сервер Django..."
exec python manage.py runserver 0.0.0.0:8000
