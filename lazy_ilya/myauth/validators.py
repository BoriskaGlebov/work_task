"""
Модуль содержит кастомный валидатор паролей для Django.
"""

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.password_validation import CommonPasswordValidator


class CustomPasswordValidator(CommonPasswordValidator):
    """
    Кастомный валидатор паролей, который проверяет минимальную длину пароля.

    Attributes:
        None

    Methods:
        validate(password, user=None): Проверяет пароль на соответствие правилам.
        get_help_text(): Возвращает текст с рекомендациями по созданию пароля.
    """

    def validate(self, password, user=None):
        """
        Проверяет пароль на соответствие правилам.

        Args:
            password (str): Пароль для проверки.
            user (User, optional): Пользователь, для которого проверяется пароль. Defaults to None.

        Raises:
            ValidationError: Если пароль не соответствует правилам.
        """
        # Проверка минимальной длины пароля
        if len(password) < 5:
            raise ValidationError(
                _("Пароль слишком короткий. Минимальная длина — 5 символов."),
                code="password_too_short",
            )

    def get_help_text(self):
        """
        Возвращает текст с рекомендациями по созданию пароля.

        Returns:
            str: Текст с рекомендациями.
        """
        return _("Пароль должен быть не менее 5 символов.")
