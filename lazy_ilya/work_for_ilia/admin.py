from django.contrib import admin
from typing import Tuple, List

from work_for_ilia.models import Counter, SomeDataFromSomeTables, SomeTables
from django.db.models import QuerySet


@admin.register(Counter)
class CounterAdmin(admin.ModelAdmin):
    """
    Админка для модели Counter.

    Attributes:
        list_display (tuple[str]): Поля для отображения в списке.
        list_filter (tuple[str]): Фильтры для боковой панели.
        search_fields (tuple[str]): Поля для поиска.
    """

    list_display: Tuple[str] = ("processed_at", "num_files")
    list_filter: Tuple[str] = ("processed_at",)
    search_fields: Tuple[str] = ("num_files",)

    def processed_at(self, obj: Counter) -> str:
        """Форматирует дату обработки."""
        return obj.processed_at.strftime("%d.%m.%Y %H:%M")

    processed_at.admin_order_field = "processed_at"
    processed_at.short_description = "Дата обработки"


class SomeDataFromSomeTablesInline(admin.TabularInline):
    """
    Inline админка для модели SomeDataFromSomeTables.
    Используется внутри админки SomeTables.

    Attributes:
        model (SomeDataFromSomeTables): Модель для inline админки.
        extra (int): Количество пустых форм для добавления новых записей.
        readonly_fields (tuple[str]): Поля, доступные только для чтения.
    """

    model = SomeDataFromSomeTables
    extra: int = 0
    readonly_fields: Tuple[str] = (
        "location",
        "name_organ",
        "pseudonim",
        "letters",
        "writing",
        "ip_address",
        "some_number",
        "work_timme",
    )


@admin.register(SomeTables)
class SomeTablesAdmin(admin.ModelAdmin):
    """
    Админка для модели SomeTables.

    Attributes:
        inlines (list[SomeDataFromSomeTablesInline]): Inline админки для связанных данных.
        list_display (tuple[str]): Поля для отображения в списке.
        list_display_links (tuple[str]): Поля, по которым можно перейти к редактированию записи.
        search_fields (tuple[str]): Поля для поиска.
        list_filter (tuple[str]): Фильтры для боковой панели.
    """

    inlines: List[SomeDataFromSomeTablesInline] = [SomeDataFromSomeTablesInline]
    list_display: Tuple[str] = ("id", "table_name", "related_data_count")
    list_display_links: Tuple[str] = "id", "table_name"
    search_fields: Tuple[str] = ("table_name",)
    list_filter: Tuple[str] = ("processed_at",)

    def related_data_count(self, obj: SomeTables) -> int:
        """Возвращает количество связанных записей в SomeDataFromSomeTables."""
        return SomeDataFromSomeTables.objects.filter(table_id=obj).count()

    related_data_count.short_description = "Количество записей"


@admin.register(SomeDataFromSomeTables)
class SomeDataFromSomeTablesAdmin(admin.ModelAdmin):
    """
    Админка для модели SomeDataFromSomeTables.

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
