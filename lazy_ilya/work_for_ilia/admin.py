from django.contrib import admin

from work_for_ilia.models import Counter, SomeTables, SomeDataFromSomeTables


# Register your models here.
@admin.register(Counter)
class CounterAdmin(admin.ModelAdmin):
    list_display = ('processed_at', 'num_files')  # Поля для отображения в списке
    list_filter = ('processed_at',)  # Фильтры для боковой панели
    search_fields = ('num_files',)  # Поля для поиска

    # Настройка отображения времени
    def processed_at(self, obj):
        return obj.processed_at.strftime("%d.%m.%Y %H:%M")  # Форматирование даты и времени

    processed_at.admin_order_field = 'processed_at'  # Позволяет сортировать по этому полю
    processed_at.short_description = 'Дата обработки'  # Название колонки в админке


@admin.register(SomeTables)
class SomeTablesAdmin(admin.ModelAdmin):
    list_display = ('id', 'table_name', 'related_data_count')  # Поля для отображения в списке
    list_display_links = 'id', 'table_name'
    search_fields = ('table_name',)  # Поля для поиска
    list_filter = ('processed_at',)  # Фильтры для боковой панели

    def related_data_count(self, obj):
        """Возвращает количество связанных записей в SomeDataFromSomeTables."""
        return SomeDataFromSomeTables.objects.filter(table_id=obj).count()

    related_data_count.short_description = 'Количество записей'  # Название колонки в админке


@admin.register(SomeDataFromSomeTables)
class SomeDataFromSomeTablesAdmin(admin.ModelAdmin):
    list_display = ('id', 'location', 'name_organ', 'pseudonim','ip_address')  # Поля для отображения в списке
    search_fields = ('location', 'name_organ','pseudonim')  # Поля для поиска
    list_filter = ('processed_at', 'table_id')  # Фильтры для боковой панели
