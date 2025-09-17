from typing import Optional

from cities.models import CityData, CityInfoDO
from django import forms
from django.core.exceptions import ValidationError
from django.forms import ModelForm


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
    """Форма для создания и редактирования объектов CityInfoDO.

    Поддерживает дополнительное поле `globus_id` для привязки к объекту CityData.
    Реализует кастомную валидацию для полей `korr` и `globus_id`,
    а также проверку на заполненность хотя бы одного из полей формы.
    """

    globus_id = forms.IntegerField(required=False)

    class Meta:
        """Метаданные формы."""

        model = CityInfoDO
        fields = [
            "korr",
            "m_b_number",
            "cipa",
            # 'globus',  # поле обрабатывается вручную через globus_id
            "recipient",
            "phone_number",
            "ip_phone",
            "notes",
        ]

    def clean_korr(self):
        """Валидация и нормализация поля korr.

        Если значение начинается с 'korr' (без учета регистра),
        префикс обрезается. После этого проверяется, что оставшаяся
        часть состоит только из цифр.

        Returns:
            str | None: Числовая часть значения korr или None, если поле пустое.

        Raises:
            ValidationError: Если после удаления префикса 'korr'
                строка содержит не только цифры.
        """
        korr = self.cleaned_data.get("korr")
        if korr:
            if korr.lower().startswith("korr"):
                korr = korr[4:]  # убираем префикс "korr"
            korr = korr.strip()
            if not korr.isdigit():
                raise ValidationError(
                    'Поле "korr" должно содержать только цифры после префикса "korr".'
                )
        return korr

    def clean_globus_id(self):
        """Валидация и преобразование поля globus_id.

        Преобразует переданный globus_id в объект CityData и сохраняет его
        в self.cleaned_data["globus"], чтобы можно было установить связь
        в модели.

        Returns:
            int | None: ID объекта CityData или None, если поле не заполнено.

        Raises:
            ValidationError: Если объект CityData с указанным ID не найден.
        """
        globus_id = (
            int(self.cleaned_data.get("globus_id"))
            if self.cleaned_data.get("globus_id")
            else None
        )
        if globus_id:
            try:
                globus_obj = CityData.objects.get(pk=globus_id)
                self.cleaned_data["globus"] = globus_obj
            except CityData.DoesNotExist:
                raise ValidationError("Город с таким globus_id не найден.")
        else:
            self.cleaned_data["globus"] = None
        return globus_id

    def save(self, commit=True):
        """Сохранение экземпляра CityInfoDO с учетом связанного globus.

        Args:
            commit (bool, optional): Если True, сразу сохраняет объект в БД.
                По умолчанию True.

        Returns:
            CityInfoDO: Экземпляр модели с установленными значениями полей.
        """
        instance = super().save(commit=False)
        if "globus" in self.cleaned_data:
            instance.globus = self.cleaned_data["globus"]
        if commit:
            instance.save()
        return instance

    def clean(self):
        """Глобальная валидация формы.

        Проверяет, что заполнено хотя бы одно из ключевых полей формы.
        Если все поля пустые, выбрасывается ошибка.

        Returns:
            dict: Очищенные данные формы.

        Raises:
            ValidationError: Если все поля пустые.
        """
        cleaned_data = super().clean()

        required_any_fields = [
            "korr",
            "m_b_number",
            "cipa",
            "recipient",
            "phone_number",
            "ip_phone",
            "notes",
        ]

        if not any(cleaned_data.get(field) for field in required_any_fields):
            raise ValidationError("Необходимо заполнить хотя бы одно поле.")

        return cleaned_data
