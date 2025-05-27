@echo off
echo Скрипт начал выполнение

REM Включить остановку при ошибке
setlocal enabledelayedexpansion

REM Путь к собранной статике
set BUILD_DIR=..\collected_static

REM Пути к статике в приложениях
set MYAUTH_STATIC=..\myauth\static\myauth
set FILECREATOR_STATIC=..\file_creator\static\file_creator
set CITIES_STATIC=..\cities\static\cities
set STATISTICS_STATIC=..\statistics_app\static\statistics_app
set SHARED_STATIC=..\lazy_ilya\static

echo Текущая директория: %CD%
echo MYAUTH_STATIC: %MYAUTH_STATIC%
echo FILECREATOR_STATIC: %FILECREATOR_STATIC%
echo CITIES_STATIC: %CITIES_STATIC%
echo STATISTICS_STATIC: %STATISTICS_STATIC%
echo SHARED_STATIC: %SHARED_STATIC%

REM Удаляем старую статику и создаём директории
if exist "%MYAUTH_STATIC%" (
    rmdir /S /Q "%MYAUTH_STATIC%"
)
mkdir "%MYAUTH_STATIC%"

if exist "%FILECREATOR_STATIC%" (
    rmdir /S /Q "%FILECREATOR_STATIC%"
)
mkdir "%FILECREATOR_STATIC%"

if exist "%CITIES_STATIC%" (
    rmdir /S /Q "%CITIES_STATIC%"
)
mkdir "%CITIES_STATIC%"

if exist "%STATISTICS_STATIC%" (
    rmdir /S /Q "%STATISTICS_STATIC%"
)
mkdir "%STATISTICS_STATIC%"

if exist "%SHARED_STATIC%" (
    rmdir /S /Q "%SHARED_STATIC%"
)
mkdir "%SHARED_STATIC%"

REM Копируем ассеты
robocopy "%BUILD_DIR%\myauth" "%MYAUTH_STATIC%" /E
robocopy "%BUILD_DIR%\file_creator" "%FILECREATOR_STATIC%" /E
robocopy "%BUILD_DIR%\cities" "%CITIES_STATIC%" /E
robocopy "%BUILD_DIR%\statistics_app" "%STATISTICS_STATIC%" /E
robocopy "%BUILD_DIR%\static" "%SHARED_STATIC%" /E

echo Assets copied to app static folders.
