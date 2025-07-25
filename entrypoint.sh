#!/bin/sh
# прервется при любой ошибке
set -e  # <-- Добавил здесь
# Переход в директорию с manage.py
cd /work_task/lazy_ilya || exit 1

echo "🟡 Выполняем миграции..."
python manage.py migrate

echo "🔧 Запускаем кастомную команду start_deploy..."
python manage.py start_deploy

echo "Сбор все статики проекта"
python manage.py collectstatic --noinput  --clear

echo "🚀 Запускаем сервер Django..."
exec daphne -b 0.0.0.0 -p 8000 lazy_ilya.asgi:application
