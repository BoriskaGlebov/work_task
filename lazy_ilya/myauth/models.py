from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractUser):
    """
    Расширенная модель пользователя с добавленным полем для номера телефона.

    Атрибуты:
        username (str): Имя пользователя, обязательное для всех пользователей.
        email (str): Адрес электронной почты, обязательный для всех пользователей.
        first_name (str): Имя пользователя.
        last_name (str): Фамилия пользователя.
        phone_number (PhoneNumberField): Номер телефона пользователя в международном формате.
        is_active (bool): Флаг активности пользователя (по умолчанию True).
        is_staff (bool): Флаг, определяющий, является ли пользователь сотрудником (по умолчанию False).
        is_superuser (bool): Флаг суперпользователя (по умолчанию False).

    Поле phone_number:
        - Это поле использует `PhoneNumberField` для хранения номера телефона.
        - Поддерживает международный формат номеров телефонов.
        - Номер телефона должен быть уникальным.
        - Обязательно для заполнения.
    """
    phone_number = PhoneNumberField(
        verbose_name=_("Телефон"),
        unique=True,
        null=False,
        blank=False,
        region='RU',  # Установить регион по умолчанию на Россию
        help_text=_("Номер в международном формате, например: +7 912 345 6789")
    )

    def __str__(self):
        """
        Строковое представление пользователя, возвращающее имя пользователя и телефон.
        """
        return f"{self.username} ({self.phone_number})"

    class Meta:
        verbose_name = _("Пользователь")
        verbose_name_plural = _("Пользователи")
