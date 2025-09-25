FROM python:3.12-bookworm

# Создаем рабочую директорию и даем права пользователю
WORKDIR /work_task

# Копируем зависимости
COPY requirements2.txt .
COPY dist2 dist2/

# Устанавливаем зависимости из локальной папки
RUN pip install --no-index --find-links dist2 -r requirements2.txt \
    && rm -rf dist2

# Копируем весь проект
COPY . .


# Рабочая директория для manage.py
WORKDIR /work_task/lazy_ilya


# Точка входа
ENTRYPOINT ["/work_task/entrypoint.sh"]
