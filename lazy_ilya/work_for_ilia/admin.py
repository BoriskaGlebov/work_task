from django.contrib import admin
from work_for_ilia.models import Counter, SomeTables, SomeDataFromSomeTables


@admin.register(Counter)
class CounterAdmin(admin.ModelAdmin):
    """
    Админка для модели Counter.

    Поля:
        list_display: Поля для отображения в списке.
        list_filter: Фильтры для боковой панели.
        search_fields: Поля для поиска.
    """

    list_display = ('processed_at', 'num_files')
    list_filter = ('processed_at',)
    search_fields = ('num_files',)

    def processed_at(self, obj):
        """Форматирует дату обработки."""
        return obj.processed_at.strftime("%d.%m.%Y %H:%M")

    processed_at.admin_order_field = 'processed_at'
    processed_at.short_description = 'Дата обработки'


@admin.register(SomeTables)
class SomeTablesAdmin(admin.ModelAdmin):
    """
    Админка для модели SomeTables.

    Поля:
        list_display: Поля для отображения в списке.
        list_display_links: Поля, по которым можно перейти к редактированию записи.
        search_fields: Поля для поиска.
        list_filter: Фильтры для боковой панели.
    """

    list_display = ('id', 'table_name', 'related_data_count')
    list_display_links = 'id', 'table_name'
    search_fields = ('table_name',)
    list_filter = ('processed_at',)

    def related_data_count(self, obj):
        """Возвращает количество связанных записей в SomeDataFromSomeTables."""
        return SomeDataFromSomeTables.objects.filter(table_id=obj).count()

    related_data_count.short_description = 'Количество записей'


@admin.register(SomeDataFromSomeTables)
class SomeDataFromSomeTablesAdmin(admin.ModelAdmin):
    """
    Админка для модели SomeDataFromSomeTables.

    Поля:
        list_display: Поля для отображения в списке.
        search_fields: Поля для поиска.
        list_filter: Фильтры для боковой панели.
    """

    list_display = ('id', 'location', 'name_organ', 'pseudonim', 'ip_address')
    search_fields = ('location', 'name_organ', 'pseudonim')
    list_filter = ('processed_at', 'table_id')
