from django.test import TestCase, Client
from django.contrib.auth.models import User, Group
from django.urls import reverse
from unittest.mock import patch, MagicMock
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile

from myauth.models import CustomUser


class CitiesAdminTests(TestCase):

    def setUp(self):
        # Создаём группу admin
        self.admin_group = Group.objects.create(name="admin")

        # Пользователь без группы
        self.user = CustomUser.objects.create_user(
            username="user", password="pass", phone_number="+79852000338"
        )

        # Пользователь с группой admin
        self.admin_user = CustomUser.objects.create_user(
            username="adminuser", password="pass", phone_number="+79852000355"
        )
        self.admin_user.groups.add(self.admin_group)

        self.client = Client()
        self.url = reverse("cities:admin_city")  # Замените на свой URL из urls.py

    def test_redirect_if_not_logged_in(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)  # Редирект на логин

    def test_forbidden_if_logged_in_but_not_in_admin_group(self):
        self.client.login(username="user", password="pass")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)
        self.assertIn("Доступ запрещён", response.content.decode())

    def test_get_ok_if_admin(self):
        self.client.login(username="adminuser", password="pass")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "cities/admin-cities.html")

    @patch("threading.Thread")
    def test_post_success_file_upload(self, mock_thread):
        self.client.login(username="adminuser", password="pass")

        # Мокаем поток
        mock_thread.return_value.start = MagicMock()

        # Создаём файл для загрузки
        file_content = b"test data"
        uploaded_file = SimpleUploadedFile("testfile.txt", file_content)

        response = self.client.post(self.url, {"cityFile": uploaded_file})

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"message": "Файл загружен успешно"})
        mock_thread.assert_called_once()
        mock_thread.return_value.start.assert_called_once()

    def test_post_no_file_uploaded(self):
        self.client.login(username="adminuser", password="pass")

        response = self.client.post(self.url, {})  # Без файла

        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(response.content, {"error": "Файл не загружен"})

    @patch("threading.Thread")
    @patch("file_creator.utils.storage.OverwritingFileSystemStorage.save")
    def test_post_exception_handling(self, mock_save, mock_thread):
        self.client.login(username="adminuser", password="pass")

        # Мокаем save так, чтобы выбрасывало исключение
        mock_save.side_effect = Exception("save error")

        file_content = b"test data"
        uploaded_file = SimpleUploadedFile("testfile.txt", file_content)

        response = self.client.post(self.url, {"cityFile": uploaded_file})

        self.assertEqual(response.status_code, 500)
        content = response.json()
        self.assertIn("error", content)
        self.assertIn("save error", content["error"])

        mock_thread.assert_not_called()
