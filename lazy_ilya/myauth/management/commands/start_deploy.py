import os
from typing import Dict, List, Optional, Any

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from dotenv import load_dotenv
from lazy_ilya.utils.settings_for_app import logger

load_dotenv()

User = get_user_model()


class UserCreator:
    """
    Класс для автоматического создания суперпользователя и дополнительных пользователей
    на основе переменных окружения.
    """

    def __init__(self) -> None:
        """
        Инициализация UserCreator с данными из переменных окружения.
        """
        self.username: Optional[str] = os.getenv("DJANGO_SUPERUSER_USERNAME")
        self.email: Optional[str] = os.getenv("DJANGO_SUPERUSER_EMAIL")
        self.password: Optional[str] = os.getenv("DJANGO_SUPERUSER_PASSWORD")
        self.phone: Optional[str] = os.getenv("DJANGO_SUPERUSER_PHONE")

        self.additional_users: List[Dict[str, Optional[str]]] = [
            {
                "username": os.getenv("DJANGO_USER1"),
                "email": os.getenv("DJANGO_USER1_EMAIL"),
                "password": os.getenv("DJANGO_USER1_PASSWORD"),
                "phone": os.getenv("DJANGO_USER1_PHONE"),
            },
            {
                "username": os.getenv("DJANGO_USER2"),
                "email": os.getenv("DJANGO_USER2_EMAIL"),
                "password": os.getenv("DJANGO_USER2_PASSWORD"),
                "phone": os.getenv("DJANGO_USER2_PHONE"),
            },
        ]

    def create_superuser(self) -> None:
        """
        Создаёт суперпользователя, если он ещё не существует.
        """
        if self.username and not User.objects.filter(username=self.username).exists():
            User.objects.create_superuser(
                username=self.username,
                email=self.email or "",
                password=self.password or "",
                phone_number=self.phone,
            )
            logger.info(f"Суперпользователь '{self.username}' создан.")
        else:
            logger.info(f"Суперпользователь '{self.username}' уже существует или не задан.")

    def create_additional_users(self) -> None:
        """
        Создаёт дополнительных пользователей, если они ещё не существуют.
        """
        for user_data in self.additional_users:
            username = user_data.get("username")
            if username and not User.objects.filter(username=username).exists():
                User.objects.create_user(
                    username=username,
                    email=user_data.get("email") or "",
                    password=user_data.get("password") or "",
                    phone_number=user_data.get("phone"),
                    is_staff=True,
                )
                logger.info(f"Пользователь '{username}' создан.")
            else:
                logger.info(f"Пользователь '{username}' уже существует или не задан.")


class GroupManager:
    """
    Класс для управления группами пользователей и назначением прав в Django.

    - Создаёт группы с определёнными правами.
    - Назначает пользователей в соответствующие группы.
    """

    def __init__(self) -> None:
        """
        Инициализирует список групп с правами и пользователей, которых нужно в них добавить.
        """
        self.groups: List[Dict[str, List[str]]] = [
            {
                "name": "admins",
                "permissions": [
                    "add_counter", "change_counter", "delete_counter", "view_counter",
                    "add_tablenames", "change_tablenames", "delete_tablenames", "view_tablenames",
                    "add_citydata", "change_citydata", "delete_citydata", "view_citydata",
                    "add_countercities", "change_countercities", "delete_countercities", "view_countercities",
                ],
            },
            {
                "name": "ilia-group",
                "permissions": [
                    "view_counter", "view_tablenames", "view_citydata",
                ],
            },
        ]

        self.user_group_assignments: List[Dict[str, Optional[str]]] = [
            {"username": os.getenv("DJANGO_USER1"), "group_name": "admins"},
            {"username": os.getenv("DJANGO_USER2"), "group_name": "ilia-group"},
        ]

    def create_groups(self) -> None:
        """
        Создаёт группы, указанные в self.groups, и назначает им соответствующие права (permissions).
        """
        for group_data in self.groups:
            group, created = Group.objects.get_or_create(name=group_data["name"])
            if created:
                logger.info(f"Группа '{group_data['name']}' создана.")
            else:
                logger.info(f"Группа '{group_data['name']}' уже существует.")

            for codename in group_data["permissions"]:
                try:
                    permission = Permission.objects.get(codename=codename)
                    group.permissions.add(permission)
                    logger.info(f"Право '{codename}' добавлено к группе '{group_data['name']}'.")
                except Permission.DoesNotExist:
                    logger.warning(f"Право с codename='{codename}' не найдено в базе.")

    def assign_users_to_groups(self) -> None:
        """
        Добавляет пользователей в группы согласно self.user_group_assignments.
        """
        for assignment in self.user_group_assignments:
            username = assignment.get("username")
            group_name = assignment.get("group_name")

            if not username or not group_name:
                logger.warning("Пропущено назначение пользователя в группу: отсутствует username или group_name.")
                continue

            try:
                user = User.objects.get(username=username)
                group = Group.objects.get(name=group_name)
                user.groups.add(group)
                logger.info(f"Пользователь '{username}' добавлен в группу '{group_name}'.")
            except User.DoesNotExist:
                logger.warning(f"Пользователь '{username}' не найден.")
            except Group.DoesNotExist:
                logger.warning(f"Группа '{group_name}' не найдена.")


class Command(BaseCommand):
    """
    Django management-команда для автоматического создания:
    - суперпользователя,
    - дополнительных пользователей,
    - групп пользователей и назначения прав.
    """

    help = "Создаёт суперпользователя, дополнительных пользователей и группы."

    def handle(self, *args: Any, **options: Any) -> None:
        """
        Основной метод, вызываемый при выполнении команды.
        Выполняет последовательные действия по созданию пользователей и групп.
        """
        # Создание суперпользователя и дополнительных пользователей
        user_creator = UserCreator()
        user_creator.create_superuser()
        user_creator.create_additional_users()

        # Создание групп и добавление пользователей в них
        group_manager = GroupManager()
        group_manager.create_groups()
        group_manager.assign_users_to_groups()

        # Подтверждение успешного выполнения
        self.stdout.write(self.style.SUCCESS("✅ Все пользователи и группы успешно созданы!"))
