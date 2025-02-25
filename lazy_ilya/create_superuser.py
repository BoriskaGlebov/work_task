# create_superuser.py
import os
import django
from typing import List, Dict

# Убедитесь, что настройки Django загружены
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "lazy_ilya.settings"
)  # Замените на имя вашего проекта
django.setup()
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management import execute_from_command_line
from dotenv import load_dotenv
from work_for_ilia.utils.my_settings.settings_for_app import logger

load_dotenv()

User = get_user_model()


class UserCreator:
    """
    Класс для создания суперпользователей и дополнительных пользователей.
    """

    def __init__(self) -> None:
        """
        Инициализация класса с данными для суперпользователя и дополнительных пользователей.
        """
        self.username: str = os.getenv("DJANGO_SUPERUSER_USERNAME")
        self.email: str = os.getenv("DJANGO_SUPERUSER_EMAIL")
        self.password: str = os.getenv("DJANGO_SUPERUSER_PASSWORD")
        self.additional_users: List[Dict[str, str]] = [
            {"username": os.getenv("DJANGO_USER1"), "email": os.getenv("DJANGO_USER1_EMAIL"),
             "password": os.getenv("DJANGO_USER1_PASSWORD")},
            {"username": os.getenv("DJANGO_USER2"), "email": os.getenv("DJANGO_USER2_EMAIL"),
             "password": os.getenv("DJANGO_USER2_PASSWORD")},
        ]

    def create_superuser(self) -> None:
        """
        Создание суперпользователя, если он не существует.
        """
        if not User.objects.filter(username=self.username).exists():
            User.objects.create_superuser(username=self.username, email=self.email, password=self.password)
            logger.info(f"Суперпользователь '{self.username}' создан.")
        else:
            logger.info(f"Суперпользователь '{self.username}' уже существует.")

    def create_additional_users(self) -> None:
        """
        Создание дополнительных пользователей, если они не существуют.
        """
        for user_data in self.additional_users:
            if not User.objects.filter(username=user_data["username"]).exists():
                User.objects.create_user(
                    username=user_data["username"],
                    email=user_data["email"],
                    password=user_data["password"],
                    is_staff=True
                )
                logger.info(f"Пользователь '{user_data['username']}' создан.")
            else:
                logger.info(f"Пользователь '{user_data['username']}' уже существует.")


class GroupManager:
    """
    Класс для управления группами и назначения прав.
    """

    def __init__(self) -> None:
        """
        Инициализация класса с данными для групп и назначения пользователей в группы.
        """
        self.groups: List[Dict[str, List[str]]] = [
            {"name": "admins",
             "permissions": ["add_counter", "change_counter", "delete_counter", "view_counter", "add_sometables",
                             "change_sometables", "delete_sometables", "view_sometables", "add_somedatafromsometables",
                             "change_somedatafromsometables", "delete_somedatafromsometables",
                             "view_somedatafromsometables",
                             ]},
            {"name": "ilia-group", "permissions": ["view_counter", "view_sometables", "view_somedatafromsometables",
                                                   ]},
        ]
        self.user_group_assignments: List[Dict[str, str]] = [
            {"username": os.getenv("DJANGO_USER1"), "group_name": "admins"},
            {"username": os.getenv("DJANGO_USER2"), "group_name": "ilia-group"},
        ]

    def create_groups(self) -> None:
        """
        Создание групп, если они не существуют, и назначение прав.
        """
        for group_data in self.groups:
            group, created = Group.objects.get_or_create(name=group_data["name"])
            if created:
                logger.info(f"Группа '{group_data['name']}' создана.")
            else:
                logger.info(f"Группа '{group_data['name']}' уже существует.")

            for permission_codename in group_data["permissions"]:
                try:
                    permission = Permission.objects.get(codename=permission_codename)
                    group.permissions.add(permission)
                    logger.info(f"Право '{permission_codename}' добавлено к группе '{group_data['name']}'.")
                except Permission.DoesNotExist:
                    logger.error(f"Право '{permission_codename}' не найдено.")

    def assign_users_to_groups(self) -> None:
        """
        Назначение пользователей в группы.
        """
        for assignment in self.user_group_assignments:
            user = User.objects.get(username=assignment["username"])
            group = Group.objects.get(name=assignment["group_name"])
            user.groups.add(group)
            logger.info(f"Пользователь '{assignment['username']}' добавлен в группу '{assignment['group_name']}'.")


if __name__ == "__main__":
    user_creator = UserCreator()
    user_creator.create_superuser()
    user_creator.create_additional_users()

    group_manager = GroupManager()
    group_manager.create_groups()
    group_manager.assign_users_to_groups()
