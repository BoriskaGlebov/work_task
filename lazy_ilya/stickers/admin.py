from django.contrib import admin

# Register your models here.
# admin.py
from django.contrib import admin
from .models import StickyNote
from .forms import StickyNoteForm


@admin.register(StickyNote)
class StickyNoteAdmin(admin.ModelAdmin):
    """
    Настройка отображения модели StickyNote в админ-панели.
    """
    form = StickyNoteForm
    list_display = ('id', 'user', 'short_text', 'color', 'author', 'created_at', 'updated_at')
    list_filter = ('color', 'created_at', 'author')
    search_fields = ('text', 'author', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('user', 'text', 'color', 'author')
        }),
        ('Позиционирование', {
            'fields': ('position_top', 'position_left')
        }),
        ('Системные поля', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def short_text(self, obj):
        return (obj.text[:30] + '...') if len(obj.text) > 30 else obj.text

    short_text.short_description = 'Текст'
