from typing import Optional

from django import forms
from django.core.exceptions import ValidationError

from django.forms import ModelForm
from cities.models import CityData, CityInfoDO


class CityDataForm(ModelForm):
    """
    Форма для создания и валидации данных модели CityData.

    Поля формы соответствуют полям модели:
    - table_id: внешний ключ на таблицу
    - dock_num: номер документа
    - location: местоположение
    - name_organ: наименование органа
    - pseudonim: псевдоним
    - letters: флаг наличия писем
    - writing: флаг наличия письменного уведомления
    - ip_address: IP-адрес
    - some_number: специальный числовой номер
    - work_time: рабочее время
    """

    class Meta:
        model = CityData
        fields = [
            "table_id",
            "dock_num",
            "location",
            "name_organ",
            "pseudonim",
            "letters",
            "writing",
            "ip_address",
            "some_number",
            "work_time",
        ]

    def clean_some_number(self) -> Optional[str]:
        """
        Проверяет, что значение поля `some_number` содержит только цифры.

        :raises ValidationError: если значение не состоит из цифр
        :return: очищенное значение поля `some_number` или None
        """
        value: Optional[str] = self.cleaned_data.get("some_number")
        if value and not value.isdigit():
            raise ValidationError("Поле «Спец. номер» должно содержать только цифры.")
        return value


class CityInfoDoForm(ModelForm):
    globus_id = forms.IntegerField(required=False)

    class Meta:
        model = CityInfoDO
        fields = [
            'korr',
            'm_b_number',
            'cipa',
            # 'globus',
            'recipient',
            'phone_number',
            'ip_phone',
            'notes',
        ]

    def clean_korr(self):
        korr = self.cleaned_data.get('korr')
        if korr:
            if korr.lower().startswith('korr'):
                korr = korr[4:]  # Обрезаем 'korr' (4 символа)
            korr = korr.strip()
            if not korr.isdigit():
                raise ValidationError('Поле "korr" должно содержать только цифры после префикса "korr"')
        return korr

    def clean_globus_id(self):
        globus_id = int(self.cleaned_data.get('globus_id')) if self.cleaned_data.get('globus_id') else None
        if globus_id:
            try:
                globus_obj = CityData.objects.get(pk=globus_id)
                self.cleaned_data['globus'] = globus_obj  # Сохраняем для сохранения модели
            except CityData.DoesNotExist:
                raise ValidationError('Город с таким globus_id не найден')
        else:
            self.cleaned_data['globus'] = None
        return globus_id

    def clean(self):
        cleaned_data = super().clean()

        # Список проверяемых полей
        required_any_fields = [
            'korr',
            'm_b_number',
            'cipa',
            'recipient',
            'phone_number',
            'ip_phone',
            'notes',
            'globus_id',
        ]

        # Проверка: есть ли хотя бы одно непустое поле
        if not any(cleaned_data.get(field) for field in required_any_fields):
            raise ValidationError("Необходимо заполнить хотя бы одно поле.")

        return cleaned_data
