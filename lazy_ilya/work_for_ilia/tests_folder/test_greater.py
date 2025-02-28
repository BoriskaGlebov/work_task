import json

from django.contrib.auth.models import User
from django.http import HttpResponse
from django.test import TestCase, Client
from django.urls import reverse


class TestGreater(TestCase):
    def setUp(self):
        self.client = Client()
        self.superuser = User.objects.create_superuser('superuser', 'super@example.com', 'password')
        self.client.force_login(self.superuser)

    def test_get_request_valid(self):
        # Создаем GET-запрос
        response = self.client.get(reverse('work_for_ilia:index'))

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response, HttpResponse)

    def test_post_request_valid_files(self):
        # Создаем тестовые файлы
        file_path1 = 'D:\\SkillBox\\work_task\\test_files\\example.doc'
        file_path2 = 'D:\\SkillBox\\work_task\\test_files\\example2.rtf'

        # Создаем POST-запрос с файлами
        with open(file_path1, 'rb') as f1, open(file_path2, 'rb') as f2:
            response = self.client.post(reverse('work_for_ilia:index'), data={'document_number': 1,
                                                                              'file': [f1, f2]},
                                        )
            self.assertEqual(response.status_code, 200)
            self.assertIn('content', response.json())
            self.assertIn('new_files', response.json())

    def test_post_request_no_files(self):
        # Создаем POST-запрос без файлов
        response = self.client.post(reverse('work_for_ilia:index'), data={'document_number': 1})

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
        self.assertEqual(response.json()['error'], 'Нет загруженных файлов')

    def test_post_request_invalid_document_number(self):
        # Создаем POST-запрос с невалидным номером документа
        file_path = 'D:\\SkillBox\\work_task\\test_files\\example.doc'

        with open(file_path, 'rb') as f:
            response = self.client.post(reverse('work_for_ilia:index'), data={'document_number': 0,
                                                                              'file': f}, )

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
        self.assertEqual(response.json()['error'], 'Номер документа должен быть больше нуля')

    def test_put_request_valid(self):
        # Создаем тестовые данные
        data = [
            {'document_number': 1, 'content': 'New content', 'new_file_name': 'test_file.txt'}
        ]
        response = self.client.put(reverse('work_for_ilia:update'), data=json.dumps(data),
                                   content_type='application/json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('status', response.json())
        self.assertEqual(response.json()['status'], 'success')

    def test_put_request_invalid_json(self):
        # Создаем PUT-запрос с невалидным JSON
        response = self.client.put(reverse('work_for_ilia:update'), data='Invalid JSON',
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('status', response.json())
        self.assertEqual(response.json()['status'], 'error')
        self.assertIn('message', response.json())
        self.assertEqual(response.json()['message'], 'Неверный формат данных.')
