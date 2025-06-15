from django.contrib import admin

# Register your models here.
# admin.py
from django.contrib import admin
from .models import StickyNote, Tag, Task
from .forms import StickyNoteForm


@admin.register(StickyNote)
class StickyNoteAdmin(admin.ModelAdmin):
    """
    Настройка отображения модели StickyNote в админ-панели.
    """
    form = StickyNoteForm
    list_display = ('id', 'owner', 'short_text', 'color', 'author_name', 'created_at', 'updated_at')
    list_filter = ('color', 'created_at', 'author_name')
    search_fields = ('text', 'author_name', 'owner__username')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('owner', 'text', 'color', 'author_name')
        }),
        ('Позиционирование', {
            'fields': ('width', 'height', 'order')
        }),
        ('Системные поля', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def short_text(self, obj):
        return (obj.text[:30] + '...') if len(obj.text) > 30 else obj.text

    short_text.short_description = 'Текст'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "assignee",
        "priority",
        "deadline",
        "done",
        "display_tags",
    )
    list_filter = ("priority", "done", "tags", "assignee")
    search_fields = ("title", "desc")
    autocomplete_fields = ("tags", "assignee")
    filter_horizontal = ("tags",)
    date_hierarchy = "deadline"
    ordering = ("-deadline",)

    def display_tags(self, obj):
        return ", ".join(tag.name for tag in obj.tags.all())

    display_tags.short_description = "Теги"
