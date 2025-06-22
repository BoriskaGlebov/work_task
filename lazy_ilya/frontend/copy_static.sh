#!/bin/bash
echo "Скрипт начал выполнение"
set -e  # Остановить скрипт при ошибке
set -x  # Включить отладочный вывод

# Путь к собранной статике
BUILD_DIR='../collected_static'

# Пути к статике в приложениях
MYAUTH_STATIC="../myauth/static/myauth"
FILECREATOR_STATIC="../file_creator/static/file_creator"
CITIES_STATIC="../cities/static/cities"
STATISTICS_STATIC="../statistics_app/static/statistics_app"
STICKERS_STATIC="../stickers/static/stickers"
SHARED_STATIC="../lazy_ilya/static"

## Покажи текущую директорию
echo "Текущая директория: $(pwd)"
echo "MYAUTH_STATIC: $MYAUTH_STATIC"
echo "FILECREATOR_STATIC: $FILECREATOR_STATIC"
echo "CITIES_STATIC: $CITIES_STATIC"
echo "STATISTICS_STATIC: $STATISTICS_STATIC"
echo "STICKERS_STATIC: $STICKERS_STATIC"
echo "SHARED_STATIC: $SHARED_STATIC"

# Удаляем старую статику и создаём директории
rm -rf "$MYAUTH_STATIC" && mkdir -p "$MYAUTH_STATIC"
rm -rf "$FILECREATOR_STATIC" && mkdir -p "$FILECREATOR_STATIC"
rm -rf "$CITIES_STATIC" && mkdir -p "$CITIES_STATIC"
rm -rf "$STATISTICS_STATIC" && mkdir -p "$STATISTICS_STATIC"
rm -rf "$STICKERS_STATIC" && mkdir -p "$STICKERS_STATIC"
rm -rf "$SHARED_STATIC" && mkdir -p "$SHARED_STATIC"
#
## Копируем ассеты
cp -r "$BUILD_DIR/myauth/"* "$MYAUTH_STATIC/"
cp -r "$BUILD_DIR/file_creator/"* "$FILECREATOR_STATIC/"
cp -r "$BUILD_DIR/cities/"* "$CITIES_STATIC/"
cp -r "$BUILD_DIR/statistics_app/"* "$STATISTICS_STATIC"
cp -r "$BUILD_DIR/stickers/"* "$STICKERS_STATIC"
cp -r "$BUILD_DIR/static/"* "$SHARED_STATIC/"
#
echo "Assets copied to app static folders."
