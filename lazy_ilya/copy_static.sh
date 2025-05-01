#!/bin/bash

set -e  # Остановить скрипт при ошибке
set -x  # Включить отладочный вывод

# Путь к собранной статике
BUILD_DIR=$(pwd)

# Пути к статике в приложениях
MYAUTH_STATIC="../myauth/static/myauth"
FILECREATOR_STATIC="./file_creator/static/filecreator"
SHARED_STATIC="../shared_static"

## Покажи текущую директорию
#echo "Текущая директория: $(pwd)"
#echo "MYAUTH_STATIC: $MYAUTH_STATIC"
#echo "FILECREATOR_STATIC: $FILECREATOR_STATIC"
#echo "SHARED_STATIC: $SHARED_STATIC"

# Удаляем старую статику и создаём директории
#rm -rf "$MYAUTH_STATIC"
#rm -rf "$MYAUTH_STATIC" && mkdir -p "$MYAUTH_STATIC"
#rm -rf "$FILECREATOR_STATIC" && mkdir -p "$FILECREATOR_STATIC"
#rm -rf "$SHARED_STATIC" && mkdir -p "$SHARED_STATIC"
#
## Копируем ассеты
#cp -r "$BUILD_DIR/myauth/"* "$MYAUTH_STATIC/"
#cp -r "$BUILD_DIR/filecreator/"* "$FILECREATOR_STATIC/"
#cp -r "$BUILD_DIR/shared_static/"* "$SHARED_STATIC/"
#
#echo "Assets copied to app static folders."
