from typing import Any, Dict, Optional, Tuple

from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.db.models import Max
from work_for_ilia.models import SomeDataFromSomeTables
from work_for_ilia.utils.my_settings.settings_for_app import logger


class CitiesForm(forms.ModelForm):
    """
    Форма для создания и редактирования записей в модели SomeDataFromSomeTables.
    """

    class Meta:
        """
        Метаданные для формы CitiesForm.
        """

        model = SomeDataFromSomeTables
        fields: Tuple[str] = (
            "table_id",
            "dock_num",
            "location",
            "name_organ",
            "pseudonim",
            "letters",
            "writing",
            "ip_address",
            "some_number",
            "work_timme",
        )
        widgets: Dict[str, forms.Widget] = {
            "writing": forms.CheckboxInput(
                attrs={"class": "hidden-checkbox", "id": "writing"}
            ),
            "letters": forms.CheckboxInput(
                attrs={"class": "hidden-checkbox", "id": "letters"}
            ),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """
        Инициализация формы CitiesForm.

        Args:
            *args: Произвольные аргументы.
            **kwargs: Произвольные именованные аргументы.
        """
        super().__init__(*args, **kwargs)
        table_id: Optional[str] = self.data.get("table_id")
        if table_id:
            # Получаем максимальный dock_num для данного table_id
            aggregate_result: Dict[str, Optional[int]] = (
                SomeDataFromSomeTables.objects.filter(table_id=table_id).aggregate(
                    Max("dock_num")
                )
            )
            last_dock_num: Optional[int] = aggregate_result["dock_num__max"]

            # Устанавливаем начальное значение для поля dock_num
            if last_dock_num is None:
                self.fields["dock_num"].initial = 1
            else:
                self.fields["dock_num"].initial = last_dock_num + 1
        else:
            # Если table_id не передан, устанавливаем начальное значение dock_num равным 1
            self.fields["dock_num"].initial = 1


class CustomUserCreationForm(UserCreationForm):
    """
    Кастомная форма регистрации пользователей, которая требует ввода электронной почты.

    Attributes:
        email (EmailField): Поле для ввода электронной почты.

    Methods:
        None

    Raises:
        None
    """

    email = forms.EmailField(
        required=True,
        help_text='Обязательное поле. Введите действующий email.',
        widget=forms.EmailInput()  # Тип виджета для поля электронной почты
    )

    class Meta:
        """
        Метаданные формы.

        Attributes:
            model (User): Модель пользователя.
            fields (tuple): Поля, которые включаются в форму.
        """
        model = User
        fields = ('username', 'email', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        """
        Инициализация формы.

        Args:
            *args: Неименованные аргументы.
            **kwargs: Именованные аргументы.
        """
        super().__init__(*args, **kwargs)


class CustomPasswordResetForm(forms.Form):
    """
    Кастомная форма сброса пароля, которая требует ввода логина, электронной почты и нового пароля.

    Attributes:
        username (CharField): Поле для ввода логина.
        email (EmailField): Поле для ввода электронной почты.
        new_password1 (CharField): Поле для ввода нового пароля.
        new_password2 (CharField): Поле для подтверждения нового пароля.

    Methods:
        clean(): Проверяет введенные данные на корректность.

    Raises:
        ValidationError: Если пользователь не найден или пароли не совпадают.
    """

    username = forms.CharField(
        max_length=150,
        required=True,
        help_text='Обязательное поле. Введите логин.',
        widget=forms.TextInput()  # Тип виджета для поля логина
    )

    email = forms.EmailField(
        max_length=254,
        required=True,
        help_text='Обязательное поле. Введите действующий email.',
        widget=forms.EmailInput()  # Тип виджета для поля электронной почты
    )

    new_password1 = forms.CharField(
        max_length=150,
        required=True,
        help_text='Обязательное поле. Введите новый пароль.',
        widget=forms.PasswordInput()  # Тип виджета для поля нового пароля
    )

    new_password2 = forms.CharField(
        max_length=150,
        required=True,
        help_text='Обязательное поле. Подтвердите новый пароль.',
        widget=forms.PasswordInput()  # Тип виджета для поля подтверждения пароля
    )

    def clean(self):
        """
        Проверяет введенные данные на корректность.

        Raises:
            ValidationError: Если пользователь не найден или пароли не совпадают.
        """
        cleaned_data = super().clean()
        username = cleaned_data.get('username')
        email = cleaned_data.get('email')
        new_password1 = cleaned_data.get('new_password1')
        new_password2 = cleaned_data.get('new_password2')

        try:
            user = User.objects.get(username=username, email=email)
        except User.DoesNotExist:
            raise forms.ValidationError('Пользователь с таким логином и электронной почтой не найден.')

        if new_password1 != new_password2:
            raise forms.ValidationError('Пароли не совпадают.')

        return cleaned_data

    def __init__(self, *args, **kwargs):
        """
        Инициализация формы.

        Args:
            *args: Неименованные аргументы.
            **kwargs: Именованные аргументы.
        """
        super().__init__(*args, **kwargs)
