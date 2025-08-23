from typing import List, Tuple

import openpyxl
from cities.models import CityData, CityInfoDO, CounterCities, TableNames
from django.contrib import admin, messages
from django.http import HttpResponse
from openpyxl.utils import get_column_letter


@admin.action(description="Экспортировать связанные CityData в Excel")
def export_citydata_to_excel(modeladmin, request, queryset):
    """ "Экспорт раздела таблицы с городами"""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "CityData Export"

    # Заголовки столбцов
    headers = [
        "Table Name",
        "ID",
        "Dock Num",
        "Location",
        "Name Organ",
        "Pseudonim",
        "Letters",
        "Writing",
        "IP Address",
        "Some Number",
        "Work Time",
    ]
    ws.append(headers)

    for table_obj in queryset:
        citydatas = CityData.objects.filter(table_id=table_obj)
        for obj in citydatas:
            row = [
                table_obj.table_name,
                obj.id,
                obj.dock_num,
                obj.location or "",
                obj.name_organ or "",
                obj.pseudonim or "",
                "Да" if obj.letters else "Нет",
                "Да" if obj.writing else "Нет",
                obj.ip_address or "",
                obj.some_number or "",
                obj.work_time or "",
            ]
            ws.append(row)

    # Подогнать ширину столбцов по содержимому
    for col_num, column_title in enumerate(headers, 1):
        column_letter = get_column_letter(col_num)
        max_length = max(len(str(cell.value)) for cell in ws[column_letter])
        adjusted_width = max_length + 2
        ws.column_dimensions[column_letter].width = adjusted_width

    # Создаем HTTP ответ с Excel файлом
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = "attachment; filename=citydata_export.xlsx"

    wb.save(response)
    return response


@admin.action(description="Очистить данные CityData, кроме dock_num")
def clear_citydata_fields(modeladmin, request, queryset):
    updated_count = 0

    for obj in queryset:
        obj.location = None
        obj.name_organ = None
        obj.pseudonim = None
        obj.letters = False
        obj.writing = False
        obj.ip_address = None
        obj.some_number = None
        obj.work_time = None
        obj.save()
        updated_count += 1

    modeladmin.message_user(
        request, f"Очищено записей: {updated_count}", level=messages.SUCCESS
    )


class CityDataInline(admin.TabularInline):
    """
    Inline админка для модели CityData.
    Используется внутри админки SomeTables.

    Attributes:
        model (CityData): Модель для inline админки.
        extra (int): Количество пустых форм для добавления новых записей.
        readonly_fields (tuple[str]): Поля, доступные только для чтения.
    """

    model = CityData
    extra: int = 0
    can_delete = False
    readonly_fields: Tuple[str] = (
        "dock_num",
        "location",
        "name_organ",
        "pseudonim",
        "letters",
        "writing",
        "ip_address",
        "some_number",
        "work_time",
    )


@admin.register(TableNames)
class TableNamesAdmin(admin.ModelAdmin):
    """
    Админка для модели TableNames.

    Attributes:
        inlines (list[CityDataInline]): Inline админки для связанных данных.
        list_display (tuple[str]): Поля для отображения в списке.
        list_display_links (tuple[str]): Поля, по которым можно перейти к редактированию записи.
        search_fields (tuple[str]): Поля для поиска.
        list_filter (tuple[str]): Фильтры для боковой панели.
    """

    inlines: List[CityDataInline] = [CityDataInline]
    list_display: Tuple[str] = ("id", "table_name", "related_data_count")
    list_display_links: Tuple[str] = "id", "table_name"
    search_fields: Tuple[str] = ("table_name",)
    list_filter: Tuple[str] = ("processed_at",)
    actions = [export_citydata_to_excel]

    def related_data_count(self, obj: TableNames) -> int:
        """Возвращает количество связанных записей в CityData."""
        return CityData.objects.filter(table_id=obj).count()

    related_data_count.short_description = "Количество записей"


class CityInfoDOInline(admin.TabularInline):
    model = CityInfoDO
    extra = 0
    fields = ("korr", "m_b_number", "cipa", "recipient", "phone_number")
    readonly_fields = ("korr", "m_b_number", "cipa", "recipient", "phone_number")
    can_delete = False


class CounterCitiesInline(admin.StackedInline):
    model = CounterCities
    extra = 0
    readonly_fields = ("count_responses",)
    can_delete = False


@admin.register(CityData)
class CityDataAdmin(admin.ModelAdmin):
    """
    Админка для модели CityData.

    Attributes:
        list_display (tuple[str]): Поля для отображения в списке.
        search_fields (tuple[str]): Поля для поиска.
        list_filter (tuple[str]): Фильтры для боковой панели.
    """

    list_display: Tuple[str] = (
        "id",
        "dock_num",
        "location",
        "name_organ",
        "pseudonim",
        "ip_address",
    )
    search_fields: Tuple[str] = ("location", "name_organ", "pseudonim")
    list_display_links: Tuple[str] = "id", "location"
    list_filter: Tuple[str] = ("processed_at", "table_id")
    actions = [
        clear_citydata_fields,
    ]
    inlines = [CityInfoDOInline, CounterCitiesInline]


@admin.register(CounterCities)
class CounterCitiesAdmin(admin.ModelAdmin):
    """
    Административный интерфейс для модели CounterCities.

    Attributes:
        list_display (Tuple[str]): Список полей, отображаемых в списке объектов модели в
            административном интерфейсе Django.
            В данном случае: "id", "dock_num", "count_responses"

        list_display_links (Tuple[str]): Список полей, которые будут отображаться как ссылки на
            страницу редактирования объекта в административном интерфейсе Django.
            В данном случае: "id", "dock_num"

        list_filter (Tuple[str]): Список полей, по которым можно фильтровать список объектов
            модели в административном интерфейсе Django.
            В данном случае: ("processed_at", "dock_num","count_responses")
    """

    list_display: Tuple[str] = ("id", "dock_num", "count_responses")
    list_display_links: Tuple[str] = "id", "dock_num"
    list_filter: Tuple[str] = ("processed_at", "dock_num", "count_responses")


@admin.register(CityInfoDO)
class CityInfoDOAdmin(admin.ModelAdmin):
    list_display = ("id", "korr", "m_b_number", "cipa", "get_globus_pseudonim")
    list_display_links = ("id", "korr", "m_b_number", "cipa", "get_globus_pseudonim")

    readonly_fields = ("globus_pseudonim_display",)

    @admin.display(description="Псевдоним Глобуса")
    def get_globus_pseudonim(self, obj):
        return obj.globus.pseudonim if obj.globus else "-"

    @admin.display(description="Псевдоним Глобуса (подробно)")
    def globus_pseudonim_display(self, obj):
        if obj.globus:
            return f"{obj.globus.pseudonim} (ID: {obj.globus.id})"
        return "-"
