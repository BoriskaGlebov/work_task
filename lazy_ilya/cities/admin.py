from typing import Tuple, List

from django.contrib import admin

from cities.models import CityData, TableNames


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
    readonly_fields: Tuple[str] = (
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

    def related_data_count(self, obj: TableNames) -> int:
        """Возвращает количество связанных записей в CityData."""
        return CityData.objects.filter(table_id=obj).count()

    related_data_count.short_description = "Количество записей"


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