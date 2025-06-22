from django.test import TestCase

from stickers.forms import StickyNoteForm


class StickyNoteFormTest(TestCase):
    def test_valid_form(self):
        form_data = {
            'text': 'Example note',
            'color': '#FF00FF',
            'width': 320,
            'height': 240,
            'author_name': 'John',
            'order': 1,
        }
        form = StickyNoteForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_blank_text_is_valid(self):
        form_data = {
            'text': '',
            'color': '#00FFFF',
            'width': 300,
            'height': 200,
            'author_name': '',
            'order': 0,
        }
        form = StickyNoteForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_negative_width_is_invalid(self):
        form_data = {
            'text': 'Invalid width',
            'color': '#00FF00',
            'width': -100,
            'height': 200,
            'author_name': 'Invalid',
            'order': 0,
        }
        form = StickyNoteForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('width', form.errors)

    def test_author_name_too_long(self):
        form_data = {
            'text': 'Note',
            'color': '#00FF00',
            'width': 200,
            'height': 200,
            'author_name': 'A' * 501,
            'order': 0,
        }
        form = StickyNoteForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('author_name', form.errors)
