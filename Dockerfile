# Используем официальный образ Python 3.8
FROM python:3.8

# Устанавливаем переменные окружения
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Устанавливаем рабочую директорию
WORKDIR /work_task


# Копируем все остальные файлы проекта
COPY . .
# Копируем файл зависимостей и устанавливаем их

#RUN #pip install -r requirements.txt
# RUN pip install --no-index --find-links dist -r requirements.txt

