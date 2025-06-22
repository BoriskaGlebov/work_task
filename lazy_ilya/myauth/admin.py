from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from django.utils.translation import gettext_lazy as _


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Админский интерфейс для модели CustomUser.

    Этот класс наследует от UserAdmin и переопределяет методы для настройки отображения
    и управления пользователями в админке Django. Он добавляет поле телефона в блок
    "Персональная информация" и настраивает отображение и поиск по полям пользователя.

    Атрибуты:
        get_fieldsets (callable): Метод для настройки отображения полей в админке для модели пользователя.
        add_fieldsets (tuple): Добавление поля телефона при создании нового пользователя.
        list_display (tuple): Поля, которые будут отображаться в списке пользователей.
        search_fields (tuple): Поля, по которым можно искать пользователей в админке.
    """

    def get_fieldsets(self, request, obj=None):
        """
        Настройка отображения полей в админке для модели пользователя.

        Этот метод переопределяет стандартные поля, добавляя поле `phone_number` в блок
        "Персональная информация", если оно не добавлено.

        Аргументы:
            request (HttpRequest): HTTP-запрос.
            obj (CustomUser, optional): Экземпляр модели пользователя, если редактируется существующий.

        Возвращает:
            list: Новый список кортежей с полями для отображения в админке.
        """
        fieldsets = super().get_fieldsets(request, obj)
        new_fieldsets = []

        for name, options in fieldsets:
            if name == _("Personal info"):  # Стандартный блок "Персональная информация"
                # Добавляем поле phone_number, если его нет в списке полей
                fields = list(options["fields"])
                if "phone_number" not in fields:
                    fields.append("phone_number")
                new_fieldsets.append((name, {"fields": fields}))
            else:
                new_fieldsets.append((name, options))

        return new_fieldsets

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            _("Personal info"),
            {"fields": ("phone_number",)},
        ),  # Добавление поля phone_number при создании пользователя
    )

    list_display = ("username", "email", "phone_number", "is_staff", "is_active")
    """
    Поля, которые будут отображаться в списке пользователей в админке.

    - `username`: Имя пользователя.
    - `email`: Электронная почта пользователя.
    - `phone_number`: Номер телефона пользователя.
    - `is_staff`: Флаг, указывающий, является ли пользователь сотрудником.
    - `is_active`: Флаг, указывающий, активен ли пользователь.
    """

    search_fields = ("username", "email", "phone_number")
    """
    Поля, по которым будет осуществляться поиск в списке пользователей в админке.

    - `username`: Имя пользователя.
    - `email`: Адрес электронной почты пользователя.
    - `phone_number`: Номер телефона пользователя.
    """
