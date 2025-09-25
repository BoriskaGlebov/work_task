FROM python:3.12-bookworm

# Создаем пользователя и группу для приложения
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Создаем рабочую директорию и даем права пользователю
WORKDIR /work_task


# Копируем зависимости
COPY requirements2.txt .
COPY dist2 dist2/

# Устанавливаем зависимости из локальной папки
RUN pip install --no-index --find-links dist2 -r requirements2.txt \
    && rm -rf dist2

# Копируем entrypoint с правами
COPY --chown=appuser:appuser --chmod=755 entrypoint.sh /work_task/entrypoint.sh

# Копируем весь проект
COPY --chown=appuser:appuser . .

RUN mkdir -p /work_task/lazy_ilya/staticfiles \
    && chown -R appuser:appuser /work_task/lazy_ilya/staticfiles \
    && mkdir -p /work_task/lazy_ilya/db \
    && chown -R appuser:appuser /work_task/lazy_ilya/db

RUN chown -R appuser:appuser /work_task
# Переключаемся на неправа root пользователя
USER appuser

# Рабочая директория для manage.py
WORKDIR /work_task/lazy_ilya


# Точка входа
ENTRYPOINT ["/work_task/entrypoint.sh"]
