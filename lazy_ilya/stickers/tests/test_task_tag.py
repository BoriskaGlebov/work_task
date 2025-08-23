from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import now
from stickers.models import Tag, Task  # замените на свой путь, если другой

from lazy_ilya.utils.settings_for_app import settings

User = get_user_model()


class TaskModelTest(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username="author",
            password="pass123",
            phone_number=settings.ALLOWED_PHONE_NUMBERS[-1],
        )
        self.assignee = User.objects.create_user(
            username="assignee",
            password="pass123",
            phone_number=settings.ALLOWED_PHONE_NUMBERS[-2],
        )
        self.tag1 = Tag.objects.create(name="Важное")
        self.tag2 = Tag.objects.create(name="Личное")

    def test_create_task_with_tags(self):
        task = Task.objects.create(
            title="Сделать дело",
            desc="Описание задачи",
            deadline=date.today() + timedelta(days=3),
            priority="high",
            done=False,
            author=self.author,
            assignee=self.assignee,
        )
        task.tags.set([self.tag1, self.tag2])
        task.save()

        self.assertEqual(task.title, "Сделать дело")
        self.assertEqual(task.author.username, "author")
        self.assertEqual(task.assignee.username, "assignee")
        self.assertEqual(task.priority, "high")
        self.assertIn(self.tag1, task.tags.all())
        self.assertIn(self.tag2, task.tags.all())
        self.assertFalse(task.done)

    def test_str_returns_title(self):
        task = Task.objects.create(title="Тестовая задача", author=self.author)
        self.assertEqual(str(task), "Тестовая задача")

    def test_to_dict_method(self):
        task = Task.objects.create(
            title="Тест Dict",
            desc="Проверка сериализации",
            priority="medium",
            done=True,
            author=self.author,
            assignee=self.assignee,
            deadline=date.today(),
        )
        task.tags.add(self.tag1)
        task_dict = task.to_dict()

        self.assertEqual(task_dict["title"], "Тест Dict")
        self.assertEqual(task_dict["author"], "author")
        self.assertEqual(task_dict["assignee"], "assignee")
        self.assertIsInstance(task_dict["tags"], list)
        self.assertEqual(task_dict["tags"][0]["name"], "Важное")
        self.assertTrue("created_at" in task_dict)
        self.assertTrue("deadline" in task_dict)
        self.assertFalse(task_dict["deleted"])
        self.assertIsNone(task_dict["deleted_by"])

    def test_created_at_and_updated_at(self):
        task = Task.objects.create(title="Временная задача", author=self.author)
        self.assertIsNotNone(task.created_at)
        self.assertIsNotNone(task.updated_at)
        self.assertAlmostEqual(task.created_at, now(), delta=timedelta(seconds=2))

    def test_task_deleted_fields(self):
        task = Task.objects.create(
            title="Удалённая задача",
            author=self.author,
            deleted=True,
            deleted_by=self.assignee,
        )
        self.assertTrue(task.deleted)
        self.assertEqual(task.deleted_by, self.assignee)

        # проверить to_dict отражает deleted поля
        task_dict = task.to_dict()
        self.assertTrue(task_dict["deleted"])
        self.assertEqual(task_dict["deleted_by"], self.assignee.username)


class TagModelTest(TestCase):
    def test_create_tag(self):
        tag = Tag.objects.create(name="Работа")
        self.assertEqual(tag.name, "Работа")
        self.assertEqual(str(tag), "Работа")

    def test_to_dict(self):
        tag = Tag.objects.create(name="Дом")
        tag_dict = tag.to_dict()
        self.assertEqual(tag_dict["name"], "Дом")
        self.assertIn("id", tag_dict)
