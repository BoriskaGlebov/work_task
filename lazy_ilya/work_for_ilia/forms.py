from django import forms
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Max
from django.forms import CheckboxInput

from work_for_ilia.models import SomeDataFromSomeTables
from work_for_ilia.utils.my_settings.settings_for_app import logger


class CitiesForm(forms.ModelForm):
    # letters = forms.BooleanField(
    #     required=False,
    #     widget=CheckboxInput,
    #     label="Письма"
    # )
    # writing = forms.BooleanField(
    #     required=False,
    #     widget=CheckboxInput,
    #     label="Записи"
    # )

    class Meta:
        model = SomeDataFromSomeTables
        fields = 'table_id', "dock_num", "location", "name_organ", "pseudonim", 'letters', "writing", "ip_address", "some_number", "work_timme"
        widgets = {
            'writing': forms.CheckboxInput(attrs={'class': 'hidden-checkbox', 'id': 'writing'}),
            'letters': forms.CheckboxInput(attrs={'class': 'hidden-checkbox', 'id': 'writing'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.data.get('table_id'):
            table_id = self.data.get('table_id')
            last_dock_num = SomeDataFromSomeTables.objects.filter(table_id=table_id).aggregate(Max('dock_num'))[
                'dock_num__max']
            if last_dock_num is None:
                self.fields["dock_num"].initial = 1
            else:
                self.fields["dock_num"].initial = last_dock_num + 1
        else:
            self.fields["dock_num"].initial = 1

    # def clean_dock_num(self):
    #     dock_num = self.cleaned_data['dock_num']
    #     table_id = self.cleaned_data.get('table_id')  # Получаем table_id
    #
    #     # Проверяем, что table_id существует
    #     if not table_id:
    #         raise ValidationError("Выберите таблицу (table_id).")
    #
    #     # Проверяем уникальность dock_num для данной table_id
    #     if SomeDataFromSomeTables.objects.filter(table_id=table_id, dock_num=dock_num).exists():
    #         logger.error(f"Попытка создать запиьс в Раздел {table_id.table_name} - {dock_num} ")
    #         raise ValidationError("Этот номер уже существует для данной таблицы.")
    #
    #     return dock_num
