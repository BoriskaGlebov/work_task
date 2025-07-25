from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model

from lazy_ilya.utils.settings_for_app import settings
from stickers.models import StickyNote
from stickers.forms import StickyNoteForm
import json

User = get_user_model()


class StickyNoteViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser12345",
            password="pass123",
            first_name="Иван",
            last_name="Иванов",
            phone_number=settings.ALLOWED_PHONE_NUMBERS[-1],
        )
        self.note = StickyNote.objects.create(
            owner=self.user, text="Тест", author_name="Иван"
        )

    def test_get_requires_login(self):
        response = self.client.get(reverse("stickers:stickers"))
        self.assertEqual(response.status_code, 302)  # редирект на логин

    def test_get_returns_notes(self):
        self.client.login(username="testuser12345", password="pass123")
        response = self.client.get(reverse("stickers:stickers"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("notes_data", response.context)

    def test_post_creates_note(self):
        self.client.login(username="testuser12345", password="pass123")
        data = {
            "text": "Новая заметка",
            "color": "#abcdef",
            "width": 400,
            "height": 300,
            "order": 1,
            "author_name": "Иван",
        }
        response = self.client.post(
            reverse("stickers:stickers"),
            data=json.dumps(data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(StickyNote.objects.count(), 2)

    def test_post_invalid_json(self):
        self.client.login(username="testuser12345", password="pass123")
        response = self.client.post(
            reverse("stickers:stickers"),
            data="not-json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_patch_updates_note(self):
        self.client.login(username="testuser12345", password="pass123")
        patch_data = {
            "id": self.note.id,
            "text": "Обновлено",
            "color": "#123456",
            "width": 200,
            "height": 150,
            "order": 2,
            "author_name": "Иван",
        }
        response = self.client.patch(
            reverse("stickers:stickers"),
            data=json.dumps(patch_data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.note.refresh_from_db()
        self.assertEqual(self.note.text, "Обновлено")

    def test_patch_missing_id(self):
        self.client.login(username="testuser12345", password="pass123")
        patch_data = {"text": "Обновлено"}
        response = self.client.patch(
            reverse("stickers:stickers"),
            data=json.dumps(patch_data),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_delete_note(self):
        self.client.login(username="testuser12345", password="pass123")
        response = self.client.delete(
            reverse("stickers:delete_stickers", args=[self.note.id])
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(StickyNote.objects.filter(id=self.note.id).exists())

    def test_delete_not_found(self):
        self.client.login(username="testuser12345", password="pass123")
        response = self.client.delete(reverse("stickers:delete_stickers", args=[999]))
        self.assertEqual(response.status_code, 404)
