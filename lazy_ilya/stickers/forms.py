# forms.py
from django import forms
from .models import StickyNote, Tag, Task


class StickyNoteForm(forms.ModelForm):
    """
    Форма для создания и редактирования заметок StickyNote.
    """

    class Meta:
        model = StickyNote
        fields = ['text', 'color', 'width', 'height', 'author_name', 'order']
        exclude = ['owner']


class TagForm(forms.ModelForm):
    """Создание / редактирование единственного тега."""

    class Meta:
        model = Tag
        fields = ["name"]
        labels = {"name": "Название тега"}
        widgets = {
            "name": forms.TextInput(
                attrs={
                    "class": "block w-full rounded border p-2",
                    "placeholder": "Введите название тега…",
                }
            )
        }

    def clean_name(self):
        # гарантируем уникальность без учёта регистра
        name = self.cleaned_data["name"].strip()
        if Tag.objects.filter(name__iexact=name).exists():
            raise forms.ValidationError("Тег с таким именем уже существует.")
        return name


class TaskForm(forms.ModelForm):
    """Основная форма задачи с множественным выбором тегов."""

    # Перепределяем поле, чтобы задать виджет и queryset вручную
    tags = forms.ModelMultipleChoiceField(
        queryset=Tag.objects.all(),
        required=False,
        widget=forms.SelectMultiple(
            attrs={
                "class": "choices-multiple w-full rounded border p-2",  # выборка для Choices.js
            }
        ),
        label="Теги",
    )

    # Удобный date-picker в браузере
    deadline = forms.DateField(
        required=False,
        widget=forms.DateInput(
            attrs={"type": "date", "class": "w-full rounded border p-2"}
        ),
        label="Срок исполнения",
    )

    done = forms.BooleanField(
        required=False,
        label="Выполнено",
        widget=forms.CheckboxInput(attrs={"class": "mr-2"}),
    )

    class Meta:
        model = Task
        fields = [
            "title",
            "desc",
            "deadline",
            "priority",
            "assignee",
            "tags",
            "done",
        ]
        labels = {
            "title": "Название",
            "desc": "Описание",
            "priority": "Приоритет",
            "assignee": "Исполнитель",
        }
        widgets = {
            "title": forms.TextInput(
                attrs={
                    "class": "w-full rounded border p-2",
                    "placeholder": "Например: «Сверстать главную страницу»",
                }
            ),
            "desc": forms.Textarea(
                attrs={
                    "class": "w-full rounded border p-2",
                    "rows": 4,
                    "placeholder": "Краткое описание задачи…",
                }
            ),
            "priority": forms.Select(
                attrs={"class": "w-full rounded border p-2"}
            ),
            "assignee": forms.Select(
                attrs={"class": "w-full rounded border p-2"}
            ),
        }

    def clean_title(self):
        # дополнительная валидация (по желанию)
        return self.cleaned_data["title"].strip()
