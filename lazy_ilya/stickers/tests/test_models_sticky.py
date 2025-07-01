from django.test import TestCase
from django.contrib.auth import get_user_model

from lazy_ilya.utils.settings_for_app import settings
from stickers.models import StickyNote

User = get_user_model()


class StickyNoteModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser12345",
            password="12345",
            first_name="Alice",
            phone_number=settings.ALLOWED_PHONE_NUMBERS[-1],
        )

    def test_create_sticky_note(self):
        note = StickyNote.objects.create(owner=self.user, text="Hello")
        self.assertIsNotNone(note.id)
        self.assertEqual(note.text, "Hello")
        self.assertEqual(note.color, "#FFEB3B")
        self.assertEqual(note.owner, self.user)
        self.assertEqual(note.author_name, "Alice")

    def test_author_name_fallback_to_username(self):
        user = User.objects.create_user(username="nousername")
        note = StickyNote.objects.create(owner=user)
        self.assertEqual(note.author_name, "nousername")

    def test_str_method(self):
        note = StickyNote.objects.create(owner=self.user)
        self.assertIn(f"{self.user.username}", str(note))
        self.assertIn("Заметка пользователя", str(note))

    def test_to_dict_output(self):
        note = StickyNote.objects.create(
            owner=self.user,
            text="Test Text",
            color="#abcdef",
            width=400,
            height=300,
            order=7,
        )
        note_dict = note.to_dict()
        self.assertEqual(note_dict["text"], "Test Text")
        self.assertEqual(note_dict["color"], "#abcdef")
        self.assertEqual(note_dict["width"], 400)
        self.assertEqual(note_dict["height"], 300)
        self.assertEqual(note_dict["order"], 7)
        self.assertEqual(note_dict["owner"], "Alice")

    def test_ordering(self):
        StickyNote.objects.create(owner=self.user, order=3)
        StickyNote.objects.create(owner=self.user, order=1)
        StickyNote.objects.create(owner=self.user, order=2)
        orders = list(StickyNote.objects.values_list("order", flat=True))
        self.assertEqual(orders, [1, 2, 3])
