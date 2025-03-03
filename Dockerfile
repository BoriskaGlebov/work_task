# Используем официальный образ Python 3.8
FROM python:3.12-slim

# Создаем рабочую директорию
WORKDIR /work_task

# Копируем файл requirements.txt
COPY requirements2.txt .
COPY dist2 dist2/
#
# Устанавливаем зависимости
#RUN pip install --no-index --find-links dist -r requirements.txt`
RUN pip install -r requirements2.txt
#
# Копируем остальные файлы приложения
COPY . .

# Устанавливаем переменные окружения
#ENV PYTHONDONTWRITEBYTECODE 1
#ENV PYTHONUNBUFFERED 1
#
WORKDIR /work_task/lazy_ilya
## Применяем миграции Django
RUN python3 manage.py migrate
#
# Создаем суперпользователя
RUN python3 create_superuser.py
#
## Экспонируем порт для сервера Django
EXPOSE 8000
#
## Запускаем команду для запуска приложения
CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:8000"]