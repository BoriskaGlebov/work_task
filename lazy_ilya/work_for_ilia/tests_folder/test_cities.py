import unittest

from django.contrib.auth.models import User
from django.test import RequestFactory
from django.urls import reverse
from work_for_ilia.views import Cities
from work_for_ilia.models import SomeDataFromSomeTables, SomeTables
import json

class TestCities(unittest.TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.superuser = User.objects.create_superuser('superuser', 'super@example.com', 'password')

    def test_post_request_valid_file(self):
        # Создаем тестовый файл
        file_path = 'path/to/test_file.csv'
        with open(file_path, 'w') as f:
            f.write('Test data')

        # Создаем POST-запрос с файлом
        with open(file_path, 'rb') as f:
            request = self.factory.post(reverse('work_for_ilia:cities'), data={'cityFile': f})
        request.user = self.superuser

        response = Cities.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('message', response.json())
        self.assertEqual(response.json()['message'], 'Файл загружен успешно')

    def test_post_request_no_file(self):
        # Создаем POST-запрос без файла
        request = self.factory.post(reverse('work_for_ilia:cities'))
        request.user = self.superuser

        response = Cities.as_view()(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
        self.assertEqual(response.json()['error'], 'Файл не загружен')

    def test_get_request_valid(self):
        # Создаем тестовые данные
        table1 = SomeTables.objects.create(table_name='Test table')
        SomeDataFromSomeTables.objects.create(table_id=table1, location='Test location')

        # Создаем GET-запрос
        request = self.factory.get(reverse('work_for_ilia:cities'))
        request.user = self.superuser

        response = Cities.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('cities_json', response.context)

    def test_put_request_valid(self):
        # Создаем тестовые данные
        table1 = SomeTables.objects.create(table_name='Test table')
        SomeDataFromSomeTables.objects.create(table_id=table1, dock_num='test_dock_num')

        # Создаем PUT-запрос с валидными данными
        data = {'location': 'New location', 'name_organ': 'New name'}
        request = self.factory.put(reverse('work_for_ilia:cities', args=[table1.pk, 'test_dock_num']), data=json.dumps(data), content_type='application/json')
        request.user = self.superuser

        response = Cities.as_view()(request, table_id=table1.pk, dock_num='test_dock_num')
        self.assertEqual(response.status_code, 200)
        self.assertIn('status', response.json())
        self.assertEqual(response.json()['status'], 'success')

    def test_delete_request_valid(self):
        # Создаем тестовые данные
        table1 = SomeTables.objects.create(table_name='Test table')
        SomeDataFromSomeTables.objects.create(table_id=table1, dock_num='test_dock_num')

        # Создаем DELETE-запрос
        request = self.factory.delete(reverse('work_for_ilia:cities', args=[table1.pk, 'test_dock_num']))
        request.user = self.superuser

        response = Cities.as_view()(request, table_id=table1.pk, dock_num='test_dock_num')
        self.assertEqual(response.status_code, 200)
        self.assertIn('status', response.json())
        self.assertEqual(response.json()['status'], 'success')

if __name__ == '__main__':
    unittest.main()
