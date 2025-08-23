import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse
from stickers.models import Task

from lazy_ilya.utils.settings_for_app import settings

User = get_user_model()


class TaskViewTests(TestCase):
    def setUp(self):
        self.client = Client()

        self.user = User.objects.create_user(
            username="john",
            password="pass1234",
            first_name="John",
            phone_number=settings.ALLOWED_PHONE_NUMBERS[-1],
        )
        self.assignee = User.objects.create_user(
            username="mary",
            password="pass1234",
            first_name="Mary",
            phone_number=settings.ALLOWED_PHONE_NUMBERS[-2],
        )

        self.client.login(username="john", password="pass1234")

    def test_create_task_minimal(self):
        response = self.client.post(
            reverse("stickers:tasks"),  # укажите правильное имя урла
            json.dumps({"title": "Test Task"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["title"], "Test Task")
        self.assertEqual(data["author"], self.user.username)
        self.assertFalse(data["done"])
        self.assertFalse(data["deleted"])
        self.assertIsNone(data["deleted_by"])

    def test_create_task_with_assignee_and_tags(self):
        response = self.client.post(
            reverse("stickers:tasks"),
            json.dumps(
                {"title": "With Tags", "assignee": "mary", "tags": ["work", "urgent"]}
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["assignee"], "mary")
        self.assertEqual(len(data["tags"]), 2)
        self.assertFalse(data["deleted"])
        self.assertIsNone(data["deleted_by"])

    def test_create_task_invalid_json(self):
        response = self.client.post(
            reverse("stickers:tasks"), "not a json", content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("errors", response.json())

    def test_create_task_missing_title(self):
        response = self.client.post(
            reverse("stickers:tasks"),
            json.dumps({"desc": "Missing title"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.json()["errors"])

    def test_patch_task_title_and_tags(self):
        task = Task.objects.create(title="Old", author=self.user)

        response = self.client.patch(
            reverse("stickers:tasks_edit", kwargs={"task_id": task.id}),
            json.dumps({"title": "New", "tags": "updated, important"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        updated = response.json()
        self.assertEqual(updated["title"], "New")
        self.assertEqual(len(updated["tags"]), 2)

    def test_patch_task_invalid_deadline(self):
        task = Task.objects.create(title="Old", author=self.user)
        response = self.client.patch(
            reverse("stickers:tasks_edit", kwargs={"task_id": task.id}),
            json.dumps({"deadline": "not-a-date"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("deadline", response.json()["errors"])

    def test_patch_task_not_found(self):
        response = self.client.patch(
            reverse("stickers:tasks_edit", kwargs={"task_id": 999}),
            json.dumps({"title": "New"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)

    def test_delete_task_success(self):
        task = Task.objects.create(title="To delete", author=self.user)
        response = self.client.delete(
            reverse("stickers:tasks_delete", kwargs={"task_id": task.id})
        )
        self.assertEqual(response.status_code, 200)
        task.refresh_from_db()
        self.assertTrue(task.deleted)
        self.assertEqual(
            task.deleted_by, self.user
        )  # предполагается, что удаляет автор

    def test_delete_task_not_found(self):
        response = self.client.delete(
            reverse("stickers:tasks_delete", kwargs={"task_id": 999})
        )
        self.assertEqual(response.status_code, 404)

    def test_post_deadline_parsing(self):
        response = self.client.post(
            reverse("stickers:tasks"),
            json.dumps({"title": "Deadline test", "deadline": "2030-01-01"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["deadline"], "2030-01-01")

    def test_delete_task_marks_deleted(self):
        task = Task.objects.create(title="Delete Mark", author=self.user)
        response = self.client.delete(
            reverse("stickers:tasks_delete", kwargs={"task_id": task.id})
        )
        self.assertEqual(response.status_code, 200)
        task.refresh_from_db()
        self.assertTrue(task.deleted)
        self.assertEqual(task.deleted_by, self.user)
