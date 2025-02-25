from django import forms

from django.db.models import Max
from typing import Tuple, Dict, Any, Optional

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
            'table_id', "dock_num", "location", "name_organ", "pseudonim", 'letters', "writing", "ip_address",
            "some_number", "work_timme"
        )
        widgets: Dict[str, forms.Widget] = {
            'writing': forms.CheckboxInput(attrs={'class': 'hidden-checkbox', 'id': 'writing'}),
            'letters': forms.CheckboxInput(attrs={'class': 'hidden-checkbox', 'id': 'letters'}),
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """
        Инициализация формы CitiesForm.

        Args:
            *args: Произвольные аргументы.
            **kwargs: Произвольные именованные аргументы.
        """
        super().__init__(*args, **kwargs)
        table_id: Optional[str] = self.data.get('table_id')
        if table_id:
            # Получаем максимальный dock_num для данного table_id
            aggregate_result: Dict[str, Optional[int]] = SomeDataFromSomeTables.objects.filter(
                table_id=table_id).aggregate(Max('dock_num'))
            last_dock_num: Optional[int] = aggregate_result['dock_num__max']

            # Устанавливаем начальное значение для поля dock_num
            if last_dock_num is None:
                self.fields["dock_num"].initial = 1
            else:
                self.fields["dock_num"].initial = last_dock_num + 1
        else:
            # Если table_id не передан, устанавливаем начальное значение dock_num равным 1
            self.fields["dock_num"].initial = 1
