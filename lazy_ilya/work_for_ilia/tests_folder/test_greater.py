import unittest
import os
import tempfile
import shutil
import json
from unittest.mock import patch, MagicMock, PropertyMock

from django.test import TestCase, RequestFactory
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.core.files.storage import Storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from django.urls import reverse

from work_for_ilia.views import Greater, ProjectSettings, OverwritingFileSystemStorage, Parser, Converter, \
    replace_unsupported_characters  # Замените your_module


class TestGreaterView(TestCase):
    """Tests for the Greater class."""

    def setUp(self):
        """Создаем временную директорию и RequestFactory."""
        self.temp_dir = tempfile.mkdtemp()
        self.factory = RequestFactory()
        # settings.configure(USE_TZ=False)  # Добавляем эту строку

    def tearDown(self):
        """Удаляем временную директорию после каждого теста."""
        shutil.rmtree(self.temp_dir)

    def test_get(self):
        """Тест для метода get."""
        request = self.factory.get('/')
        response = Greater.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "work_for_ilia/index.html")

    @patch('your_module.ProjectSettings.tlg_dir', new_callable=PropertyMock)
    @patch('your_module.OverwritingFileSystemStorage.save')
    @patch('your_module.Converter.convert_files')
    @patch('your_module.Parser.create_file_parsed')
    @patch('os.listdir')
    @patch('os.path.isfile')
    @patch('os.remove')
    @patch('your_module.logger')
    def test_post_success(self, mock_logger, mock_os_remove, mock_os_isfile, mock_os_listdir, mock_create_file_parsed,
                          mock_convert_files, mock_fs_save, mock_tlg_dir):
        """Тест для метода post при успешной загрузке файлов."""
        # Arrange
        mock_tlg_dir.return_value = self.temp_dir
        mock_fs_save.return_value = 'test_file.docx'
        mock_create_file_parsed.return_value = ['Parsed content']
        mock_os_listdir.return_value = ['test_file.docx', 'test_file.txt']
        mock_os_isfile.return_value = True
        request = self.factory.post(
            '/',
            {
                'file': [SimpleUploadedFile("test_file.docx", b"content")],
                'document_number': 1,
            }
        )

        # Act
        response = Greater.as_view()(request)

        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)['content'], ['Parsed content'])
        mock_fs_save.assert_called()
        mock_convert_files.assert_called()
        mock_create_file_parsed.assert_called()
        mock_os_remove.assert_called()
        mock_logger.debug.assert_called()

    @patch('your_module.logger')
    def test_post_no_files(self, mock_logger):
        """Тест для метода post, когда не загружены файлы."""
        # Arrange
        request = self.factory.post('/', {'document_number': 1})

        # Act
        response = Greater.as_view()(request)

        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content)['error'], 'Нет загруженных файлов')

    @patch('your_module.logger')
    def test_post_invalid_document_number(self, mock_logger):
        """Тест для метода post, когда неверный номер документа."""
        # Arrange
        request = self.factory.post(
            '/',
            {
                'file': [SimpleUploadedFile("test_file.docx", b"content")],
                'document_number': 0,
            }
        )

        # Act
        response = Greater.as_view()(request)

        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content)['error'],
            'Номер документа должен быть больше нуля'
        )

    def test_put_success(self):
        """Test the put method with valid data."""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, dir=self.temp_dir) as temp_file:
            # Create a temporary file for testing
            temp_file_path = temp_file.name
            temp_file_name = os.path.basename(temp_file_path)
            temp_file.write(b"Initial content")
            temp_file.close()

            # Prepare test data
            data = [{
                "document_number": 1,
                "content": "Test content",
                "new_file_name": temp_file_name
            }]
            json_data = json.dumps(data)

            # Create a PUT request
            request = self.factory.put('/', data=json_data, content_type='application/json')

            # Call the put method
            response = Greater.as_view()(request)

            # Assert the response
            self.assertEqual(response.status_code, 200)
            self.assertEqual(json.loads(response.content)['status'], 'success')

            # Read the content of the file
            with open(temp_file_path, 'r', encoding='cp866') as file:
                file_content = file.read()
            self.assertEqual(file_content, "Test content")

            # Clean up the temporary file
            os.remove(temp_file_path)

    def test_put_invalid_json(self):
        """Test the put method with invalid JSON data."""
        # Create a PUT request with invalid JSON data
        request = self.factory.put('/', data="invalid json", content_type='application/json')

        # Call the put method
        response = Greater.as_view()(request)

        # Assert the response
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content)['status'], 'error')

    def test_put_exception(self):
        """Test the put method when an exception occurs."""
        with patch('your_module.json.loads', side_effect=Exception("Test exception")):
            # Create a PUT request
            request = self.factory.put('/', data='{}', content_type='application/json')

            # Call the put method
            response = Greater.as_view()(request)

            # Assert the response
            self.assertEqual(response.status_code, 500)
            self.assertIn("Test exception", json.loads(response.content)['error'])
