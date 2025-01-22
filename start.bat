@echo off


REM Output the current directory from which the script is run
echo Current directory:
cd

REM Path to your Django application directory
set APP_DIR=D:\SkillBox\work_task\lazy_ilya

REM Check if the directory exists
if not exist "%APP_DIR%" (
    echo Directory %APP_DIR% not found!
    exit /b 1
)



REM Create a virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating a virtual environment...
    py -3.8 -m venv venv
)

REM Activate the virtual environment
echo Activating the virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies from requirements.txt
if exist "requirements.txt" (
    echo Installing dependencies from requirements.txt...
    pip install --no-index --find-links dist -r requirements.txt
) else (
    echo requirements.txt file not found!
    pause
    exit /b 1
)
pause

REM Change to the application directory
cd /d "%APP_DIR%" || exit /b 1

REM Start the Django application
echo Starting the Django application...

python manage.py migrate
python manage.py runserver
