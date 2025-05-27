import os
from typing import Dict, List

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from dotenv import load_dotenv
from lazy_ilya.utils.settings_for_app import logger

load_dotenv()

User = get_user_model()


class UserCreator:
    def __init__(self) -> None:
        self.username: str = os.getenv("DJANGO_SUPERUSER_USERNAME")
        self.email: str = os.getenv("DJANGO_SUPERUSER_EMAIL")
        self.password: str = os.getenv("DJANGO_SUPERUSER_PASSWORD")
        self.phone:str=os.getenv("DJANGO_SUPERUSER_PHONE")
        self.additional_users: List[Dict[str, str]] = [
            {
                "username": os.getenv("DJANGO_USER1"),
                "email": os.getenv("DJANGO_USER1_EMAIL"),
                "password": os.getenv("DJANGO_USER1_PASSWORD"),
                "phone":os.getenv("DJANGO_USER1_PHONE")
            },
            {
                "username": os.getenv("DJANGO_USER2"),
                "email": os.getenv("DJANGO_USER2_EMAIL"),
                "password": os.getenv("DJANGO_USER2_PASSWORD"),
                "phone": os.getenv("DJANGO_USER2_PHONE")
            },
        ]

    def create_superuser(self) -> None:
        if not User.objects.filter(username=self.username).exists():
            User.objects.create_superuser(
                username=self.username,
                email=self.email,
                password=self.password,
                phone_number=self.phone,
            )
            logger.info(f"Суперпользователь '{self.username}' создан.")
        else:
            logger.info(f"Суперпользователь '{self.username}' уже существует.")

    def create_additional_users(self) -> None:
        for user_data in self.additional_users:
            if not User.objects.filter(username=user_data["username"]).exists():
                User.objects.create_user(
                    username=user_data["username"],
                    email=user_data["email"],
                    password=user_data["password"],
                    phone_number=user_data["phone"],
                    is_staff=True,
                )
                logger.info(f"Пользователь '{user_data['username']}' создан.")
            else:
                logger.info(f"Пользователь '{user_data['username']}' уже существует.")


class GroupManager:
    def __init__(self) -> None:
        self.groups: List[Dict[str, List[str]]] = [
            {
                "name": "admins",
                "permissions": [
                    "add_counter", "change_counter", "delete_counter", "view_counter",
                    "add_tablenames", "change_tablenames", "delete_tablenames", "view_tablenames",
                    "add_citydata", "change_citydata",
                    "delete_citydata", "view_citydata",
                    "add_countercities", "change_countercities",
                    "delete_countercities", "view_countercities",
                ],
            },
            {
                "name": "ilia-group",
                "permissions": [
                    "view_counter", "view_tablenames",
                    "view_citydata", "view_citydata",
                ],
            },
        ]
        self.user_group_assignments: List[Dict[str, str]] = [
            {"username": os.getenv("DJANGO_USER1"), "group_name": "admins"},
            {"username": os.getenv("DJANGO_USER2"), "group_name": "ilia-group"},
        ]

    def create_groups(self) -> None:
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
                    logger.warning(f"Право '{codename}' не найдено.")

    def assign_users_to_groups(self) -> None:
        for assignment in self.user_group_assignments:
            try:
                user = User.objects.get(username=assignment["username"])
                group = Group.objects.get(name=assignment["group_name"])
                user.groups.add(group)
                logger.info(f"Пользователь '{assignment['username']}' добавлен в группу '{assignment['group_name']}'.")
            except User.DoesNotExist:
                logger.warning(f"Пользователь '{assignment['username']}' не найден.")
            except Group.DoesNotExist:
                logger.warning(f"Группа '{assignment['group_name']}' не найдена.")


class Command(BaseCommand):
    help = "Создаёт суперпользователя, дополнительных пользователей и группы"

    def handle(self, *args, **options):
        user_creator = UserCreator()
        user_creator.create_superuser()
        user_creator.create_additional_users()

        group_manager = GroupManager()
        group_manager.create_groups()
        group_manager.assign_users_to_groups()

        self.stdout.write(self.style.SUCCESS("✅ Все пользователи и группы успешно созданы!"))
