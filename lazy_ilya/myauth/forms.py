from typing import Any

from django.contrib.auth.forms import UserCreationForm

from .models import CustomUser


class CustomUserCreationForm(UserCreationForm):
    """
    Форма регистрации пользователя, основанная на модели CustomUser.

    Наследует стандартную форму UserCreationForm и расширяет её, добавляя
    поля: имя, фамилия, номер телефона и email. Также добавлены кастомные
    сообщения об ошибках и валидация совпадения паролей.

    Атрибуты:
        Meta:
            model (CustomUser): Модель пользователя.
            fields (tuple): Список отображаемых полей.
            error_messages (dict): Кастомные сообщения об ошибках.
    """

    class Meta:
        model = CustomUser
        fields = ('username', 'first_name', 'last_name', 'phone_number', 'email')
        error_messages = {
            "phone_number": {
                "unique": "Пользователь с таким номером телефона уже зарегистрирован.",
                "invalid": "Введите корректный номер телефона в формате +7 (985) 200-03-38.",
            },
        }

    def clean(self) -> dict[str, Any]:
        """
        Переопределяет метод clean для добавления проверки совпадения паролей.

        Returns:
            dict[str, Any]: Очищенные и валидированные данные формы.

        Raises:
            ValidationError: Если пароли не совпадают.
        """
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            self.add_error(field="password2", error="Кожаный, будь внимателен, пароли должны совпадать!!!")

        cleaned_data = super().clean()
        return cleaned_data
