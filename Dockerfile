# Используем официальный образ Python 3.8
FROM python:3.8-slim

# Создаем рабочую директорию
WORKDIR /work_task

# Копируем файл requirements.txt
COPY requirements.txt .
COPY dist dist/
#
## Устанавливаем зависимости
#RUN pip install --no-index --find-links dist -r requirements.txt`
RUN pip install -r requirements.txt
#
## Копируем остальные файлы приложения
#COPY . .
#
### Устанавливаем переменные окружения
##ENV PYTHONDONTWRITEBYTECODE 1
##ENV PYTHONUNBUFFERED 1
#
#WORKDIR /lazy_ilya
## Применяем миграции Django
#RUN python manage.py migrate
#
## Создаем суперпользователя
#RUN python create_superuser.py
#
## Экспонируем порт для сервера Django
#EXPOSE 8000
#
## Запускаем команду для запуска приложения
#CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:8000"]