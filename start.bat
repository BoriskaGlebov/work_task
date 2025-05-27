@echo off

REM Загружаем переменные окружения из .env файла
REM Этот блок кода предназначен для загрузки переменных окружения из файла с именем ".env".
REM Переменные окружения позволяют настраивать параметры приложения без изменения самого кода.
setlocal enabledelayedexpansion
REM Включаем "delayed expansion" для корректной обработки переменных внутри цикла for.
for /f "usebackq tokens=1,2 delims==" %%a in (`type .env`) do (
REM Читаем файл .env построчно. "usebackq" позволяет использовать обратные кавычки для выполнения команды type.
REM "tokens=1,2" разделяет строку на две части, используя "delims==" в качестве разделителя.
REM %%a получает имя переменной, %%b - её значение.
    set %%a=%%b
REM Устанавливаем переменную окружения с именем %%a и значением %%b.
)

REM Выводим текущую директорию, из которой запущен скрипт
echo Current directory:
cd
REM Команда cd без аргументов выводит текущую директорию.

REM Проверяем, существует ли директория приложения
if not exist "%APP_DIR%" (
REM Проверяем, существует ли директория, указанная в переменной APP_DIR.
    echo Directory %APP_DIR% not found!
    pause
    exit /b 1
REM Если директория не существует, выводим сообщение об ошибке и завершаем скрипт с кодом возврата 1.
)

REM Создаем виртуальное окружение, если оно не существует
if not exist "venv" (
REM Проверяем, существует ли директория "venv" (обычное название для виртуального окружения Python).
    echo Creating a virtual environment...
    py -3.8 -m venv venv
REM Если виртуальное окружение не существует, создаем его с помощью команды "py -3.8 -m venv venv".
REM "py -3.8" указывает на использование Python версии 3.8.
REM "venv venv" создает виртуальное окружение в директории "venv".
)

REM Активируем виртуальное окружение
echo Activating the virtual environment...
call venv\Scripts\activate.bat
REM Активируем виртуальное окружение, запуская скрипт "activate.bat" из директории "venv\Scripts".
REM Активация виртуального окружения изменяет переменные окружения, чтобы использовать пакеты Python, установленные в этом окружении.

REM Устанавливаем зависимости из requirements.txt
if exist "requirements.txt" (
REM Проверяем, существует ли файл "requirements.txt". Этот файл содержит список зависимостей Python, необходимых для приложения.
    echo Installing dependencies from requirements.txt...
    pip install --no-index --find-links dist -r requirements.txt
REM Устанавливаем зависимости, используя pip.
REM "--no-index" отключает использование PyPI (Python Package Index) для поиска пакетов.
REM "--find-links dist" указывает pip искать пакеты в локальной директории "dist".
REM "-r requirements.txt" указывает pip прочитать список пакетов из файла "requirements.txt".
) else (
    echo requirements.txt file not found!
    pause
    exit /b 1
REM Если файл "requirements.txt" не найден, выводим сообщение об ошибке, ставим скрипт на паузу и завершаем его с кодом возврата 1.
)


REM Переходим в директорию приложения
cd /d "%APP_DIR%" || exit /b 1
REM Переходим в директорию, указанную в переменной APP_DIR.
REM "/d" позволяет изменить диск, если APP_DIR указывает на другой диск.
REM "|| exit /b 1" означает, что если команда cd завершится с ошибкой, скрипт завершится с кодом возврата 1.

REM Применяем миграции Django
python manage.py migrate
REM Запускаем миграции Django. Миграции используются для обновления схемы базы данных в соответствии с изменениями в моделях Django.

REM Проверяем и создаем суперпользователя, если он не существует и создает все для старта
echo Checking and creating superuser if necessary...
python manage.py start_deploy

REM Запускаем Django приложение
echo Starting the Django application...
python manage.py runserver
REM Запускаем Django development server. Это простой сервер, который используется для разработки и тестирования приложения.
REM Он будет принимать запросы на локальном адресе (обычно http://127.0.0.1:8000/).
