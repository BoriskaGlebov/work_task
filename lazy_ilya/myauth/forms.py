# forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ('username', 'first_name', 'last_name', 'phone_number', 'email')
        error_messages = {
            "phone_number": {
                "unique": "Пользователь с таким номером телефона уже зарегистрирован.",
                "invalid": "Введите корректный номер телефона в формате +7 (985) 200-03-38.",
            },
        }

    def clean(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            self.add_error(field="password2", error="Кожаный, будь внимателен, пароли должны совпадать!!!")
        cleaned_data = super().clean()
        return cleaned_data
