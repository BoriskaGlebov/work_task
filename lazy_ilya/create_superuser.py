# create_superuser.py
import os

from django.contrib.auth import get_user_model
from django.core.management import execute_from_command_line
from dotenv import load_dotenv
from work_for_ilia.utils.my_settings.settings_for_app import logger

load_dotenv()
# Убедитесь, что настройки Django загружены
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "lazy_ilya.settings"
)  # Замените на имя вашего проекта
import django

django.setup()

User = get_user_model()

username = os.getenv("DJANGO_SUPERUSER_USERNAME")
email = os.getenv("DJANGO_SUPERUSER_EMAIL")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD")
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    logger.info(f"Суперпользователь '{username}' создан.")
else:
    logger.info(f"Суперпользователь '{username}' уже существует.")
