from typing import Any, Dict

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
                "invalid": "Введите корректный номер телефона в формате \n +7 (999) 999-99-99.",
            },
        }

    def clean(self) -> Dict[str, Any]:
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
            self.add_error('password2', 'Кожаный, будь внимателен, пароли должны \nсовпадать!!!')
        if password1 and len(password1) < 5:
            self.add_error('password1', 'Длина пароля от 5 символов!')
        if password2 and len(password2) < 5:
            self.add_error('password2', 'Длина пароля от 5 символов!')
        # Вызывается позже, что ю сработала моя валидация с кастомным сообщением
        cleaned_data = super().clean()
        return cleaned_data

    def clean_password1(self):
        password1 = self.cleaned_data.get("password1")
        if password1 and len(password1) < 5:
            raise forms.ValidationError("Длина пароля от 5 символов!")
        return password1

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Кожаный, будь внимателен, пароли должны \nсовпадать!!!")
        if password2 and len(password2) < 5:
            raise forms.ValidationError("Длина пароля от 5 символов!")
        return password2


class PasswordResetForm(forms.Form):
    """
    Форма для сброса пароля пользователя по логину и номеру телефона.

    Поля:
        username (str): Логин пользователя.
        phone_number (PhoneNumber): Телефонный номер пользователя (в формате +7).
        password1 (str): Новый пароль.
        password2 (str): Повтор нового пароля.

    Методы:
        clean(): Переопределяет общую валидацию формы. Проверяет совпадение паролей
                 и существование пользователя с заданными логином и телефоном.
    """

    username: str = forms.CharField(
        label="Логин",
        max_length=150
    )
    phone_number = PhoneNumberField(
        label="Телефон",
        region="RU",
        error_messages={
            "invalid": "Введите корректный номер телефона в формате \n +7 (999) 999-99-99.",
        }
    )
    password1: str = forms.CharField(
        label="Новый пароль",
        widget=forms.PasswordInput
    )
    password2: str = forms.CharField(
        label="Повтор пароля",
        widget=forms.PasswordInput
    )

    def clean(self) -> dict:
        """
        Проводит общую валидацию формы:
        - Проверяет, что пароли совпадают.
        - Проверяет, что пользователь с указанным логином и телефоном существует.

        Returns:
            dict: Очищенные данные формы (cleaned_data).
        """

        username = self.cleaned_data.get('username')
        phone_number = self.cleaned_data.get('phone_number')
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            self.add_error('password2', 'Кожаный, будь внимателен, пароли должны \nсовпадать!!!')
        if password1 and len(password1) < 5:
            self.add_error('password1', 'Длина пароля от 5 символов!')
        if password2 and len(password2) < 5:
            self.add_error('password2', 'Длина пароля от 5 символов!')
        if username and phone_number:
            try:
                self.user = CustomUser.objects.get(username=username, phone_number=phone_number)
            except CustomUser.DoesNotExist:
                self.add_error("username", "Пользователь с такими данными не найдет")

        cleaned_data = super().clean()
        return cleaned_data
