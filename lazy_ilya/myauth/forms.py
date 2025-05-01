from typing import Any

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.forms import ModelForm, Form
from phonenumber_field.formfields import PhoneNumberField

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
        # Вызывается позже, что ю сработала моя валидация с кастомным сообщением
        cleaned_data = super().clean()
        return cleaned_data


class PasswordResetForm(Form):
    username = forms.CharField(label="Логин", max_length=150)
    phone_number = PhoneNumberField(label="Телефон", region="RU", error_messages={
        "invalid": "Введите корректный номер телефона в формате +7 (985) 200-03-38.",
    })
    password1 = forms.CharField(label="Новый пароль", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Повтор пароля", widget=forms.PasswordInput)

    # class Meta:
    #     model = CustomUser
    #     fields = ["username", "phone_number"]

    def clean(self):

        username = self.cleaned_data.get('username')
        phone_number = self.cleaned_data.get('phone_number')
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')

        if password1 and password2 and password1 != password2:
            self.add_error('password2', 'Пароли не совпадают')

        if username and phone_number:
            try:
                self.user = CustomUser.objects.get(username=username, phone_number=phone_number)
            except CustomUser.DoesNotExist:
                self.add_error("username","Пользователь с такими данными не найдет")
                # raise forms.ValidationError("Пользователь с такими данными не найден")
        cleaned_data = super().clean()
        return cleaned_data
