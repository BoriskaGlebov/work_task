from django import forms

from django.db.models import Max


from work_for_ilia.models import SomeDataFromSomeTables
from work_for_ilia.utils.my_settings.settings_for_app import logger


class CitiesForm(forms.ModelForm):
    class Meta:
        model = SomeDataFromSomeTables
        fields = 'table_id', "dock_num", "location", "name_organ", "pseudonim", 'letters', "writing", "ip_address", "some_number", "work_timme"
        widgets = {
            'writing': forms.CheckboxInput(attrs={'class': 'hidden-checkbox', 'id': 'writing'}),
            'letters': forms.CheckboxInput(attrs={'class': 'hidden-checkbox', 'id': 'letters'}),
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
