import os.path

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase, Client
from django.urls import reverse
from work_for_ilia.views import Cities
from work_for_ilia.models import SomeDataFromSomeTables, SomeTables
import json


class TestCities(TestCase):
    def setUp(self):
        self.client = Client()
        self.superuser = User.objects.create_superuser('superuser', 'super@example.com', 'password')
        self.client.force_login(self.superuser)

    def test_post_request_valid_file(self):
        # Создаем тестовый файл
        file_path = 'D:\\SkillBox\\work_task\\test_files\\globus.docx'
        self.assertTrue(os.path.exists(file_path))

        # Создаем POST-запрос с файлом
        with open(file_path, 'rb') as f:
            response = self.client.post(reverse('work_for_ilia:cities'), {'cityFile': f})
        print(response)
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.json())
        self.assertEqual(response.json()['message'], 'Файл загружен успешно')

    def test_post_request_no_file(self):
        # Создаем POST-запрос без файла
        response = self.client.post(reverse('work_for_ilia:cities'))

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
        self.assertEqual(response.json()['error'], 'Файл не загружен')

    def test_get_request_valid(self):
        # Создаем тестовые данные
        table1 = SomeTables.objects.create(table_name='Test table')
        SomeDataFromSomeTables.objects.create(table_id=table1, location='Test location')

        # Создаем GET-запрос
        response = self.client.get(reverse('work_for_ilia:cities'))
        self.assertEqual(response.status_code, 200)
        self.assertIn('cities_json', response.context)

    def test_put_request_valid(self):
        # Создаем тестовые данные
        table1 = SomeTables.objects.create(table_name='Test table')
        SomeDataFromSomeTables.objects.create(table_id=table1, dock_num=1)

        # Создаем PUT-запрос с валидными данными
        data = {'location': 'New location', 'name_organ': 'New name'}
        response = self.client.put(reverse('work_for_ilia:edit_city', args=[table1.pk, 1]),
                                   data=data, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('status', response.json())
        self.assertEqual(response.json()['status'], 'success')

    def test_delete_request_valid(self):
        # Создаем тестовые данные
        table1 = SomeTables.objects.create(table_name='Test table')
        SomeDataFromSomeTables.objects.create(table_id=table1, dock_num='test_dock_num')

        # Создаем DELETE-запрос
        response = self.client.delete(reverse('work_for_ilia:delete_city', args=[table1.pk, 1]))


        self.assertEqual(response.status_code, 200)
        self.assertIn('status', response.json())
        self.assertEqual(response.json()['status'], 'success')
