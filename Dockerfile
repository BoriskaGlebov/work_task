FROM python:3.12-bookworm

# Создаем рабочую директорию
WORKDIR /work_task

# Копируем зависимости
COPY requirements2.txt .
COPY dist2 dist2/

# Устанавливаем зависимости из локальной папки
RUN pip install --no-index --find-links dist2 -r requirements2.txt
RUN rm -rf dist2
# Копируем entrypoint отдельно с правильными правами
COPY --chmod=755 entrypoint.sh /work_task/entrypoint.sh

# Копируем весь проект
COPY . .

# Делаем скрипт запуска исполняемым
RUN chmod +x /work_task/entrypoint.sh

# Устанавливаем рабочую директорию для manage.py
WORKDIR /work_task/lazy_ilya

# Открываем порт
EXPOSE 8000

# Устанавливаем точку входа — запускаем shell-скрипт
ENTRYPOINT ["/work_task/entrypoint.sh"]
