from django import forms
from django.core.exceptions import ValidationError
from django.db import models

from work_for_ilia.models import SomeDataFromSomeTables


class CitiesForm(forms.ModelForm):
    class Meta:
        model = SomeDataFromSomeTables
        fields = 'table_id', "dock_num", "location", "name_organ", "pseudonim", 'letters', "writing", "ip_address", "some_number", "work_timme"

    def __init__(self, *args, **kwargs):
        table_id = kwargs.pop(
            "table_id", None
        )  # Получаем table_id из kwargs, если он есть
        super().__init__(*args, **kwargs)

        if table_id:
            # Получаем последний dock_num для данной table_id
            last_dock_num = (
                SomeDataFromSomeTables.objects.filter(table_id=table_id)
                .aggregate(models.Max("dock_num"))["dock_num__max"]
            )
            # Устанавливаем начальное значение для dock_num
            if last_dock_num is None:
                self.fields["dock_num"].initial = 1
            else:
                self.fields["dock_num"].initial = last_dock_num + 1
        else:
            self.fields["dock_num"].initial = 1  # Или другое значение по умолчанию

    def clean_dock_num(self):
        dock_num = self.cleaned_data['dock_num']
        table_id = self.cleaned_data.get('table_id')  # Получаем table_id

        # Проверяем, что table_id существует
        if not table_id:
            raise ValidationError("Выберите таблицу (table_id).")

        # Проверяем уникальность dock_num для данной table_id
        if SomeDataFromSomeTables.objects.filter(table_id=table_id, dock_num=dock_num).exists():
            raise ValidationError("Этот номер уже существует для данной таблицы.")

        return dock_num
