from typing import Optional

from django.core.exceptions import ValidationError

from django.forms import ModelForm
from cities.models import CityData


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
