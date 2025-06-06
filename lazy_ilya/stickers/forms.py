# forms.py
from django import forms
from .models import StickyNote


class StickyNoteForm(forms.ModelForm):
    """
    Форма для создания и редактирования заметок StickyNote.
    """

    class Meta:
        model = StickyNote
        fields = ['text', 'color', 'width', 'height', 'author_name','order']
        exclude=['owner']

