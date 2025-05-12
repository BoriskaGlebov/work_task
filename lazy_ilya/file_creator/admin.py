from typing import Tuple

from django.contrib import admin

from file_creator.models import Counter


# Register your models here.
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