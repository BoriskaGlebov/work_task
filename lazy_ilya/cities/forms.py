from django.core.exceptions import ValidationError
from django.forms import ModelForm

from cities.models import CityData


class CityDataForm(ModelForm):
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

    def clean_some_number(self):
        value = self.cleaned_data.get("some_number")
        if value and not value.isdigit():
            raise ValidationError("Поле спец номер: должно содержать только цифры.")
        return value
