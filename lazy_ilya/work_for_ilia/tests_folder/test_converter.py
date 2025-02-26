import io
import unittest
import os

from docx import Document
import win32com.client

from work_for_ilia.utils.custom_converter.converter_to_docx import \
    Converter  # Импортируйте класс Converter из вашего модуля
from pathlib import Path
import tempfile
import shutil


class TestConverter(unittest.TestCase):

    def setUp(self):
        # Создаем временную директорию для тестов
        self.temp_dir = tempfile.mkdtemp()
        self.converter = Converter(self.temp_dir)

    def tearDown(self):
        # Удаляем временную директорию после каждого теста
        shutil.rmtree(self.temp_dir)

    def test_init(self):
        # Проверяем инициализацию класса
        self.assertEqual(self.converter.dir, self.temp_dir)

    def test_all_files(self):
        # Создаем реальные документы
        word = win32com.client.Dispatch('Word.Application')

        # Создаем .doc файл
        doc = word.Documents.Add()
        doc.Range().Text = 'Test content'
        doc.SaveAs(os.path.join(self.temp_dir, 'test.doc'))
        doc.Close()

        # Создаем .rtf файл
        doc = word.Documents.Add()
        doc.Range().Text = 'Test content'
        doc.SaveAs(os.path.join(self.temp_dir, 'test.rtf'), FileFormat=6)  # 6 — это формат RTF
        doc.Close()

        # Создаем .docx файл (не нужно конвертировать)
        docx_file = Document()
        docx_file.add_paragraph('Test content')
        docx_file.save(os.path.join(self.temp_dir, 'test.docx'))

        # Создаем .txt файл
        with open(os.path.join(self.temp_dir, 'test.txt'), 'w') as f:
            f.write('Test content')

        # Закрываем Word
        word.Quit()

        # Проверяем список файлов без .txt и .docx
        files = self.converter.all_files()
        self.assertIn('test.rtf', files)
        self.assertIn('test.doc', files)
        self.assertNotIn('test.txt', files)
        self.assertNotIn('test.docx', files)

    def test_convert_files(self):
        # Создаем тестовый файл для конвертации
        # Создаем .rtf файл
        # Создаем реальные документы
        word = win32com.client.Dispatch('Word.Application')
        doc = word.Documents.Add()
        doc.Range().Text = 'Test content'
        doc.SaveAs(os.path.join(self.temp_dir, 'test.rtf'), FileFormat=6)  # 6 — это формат RTF
        doc.Close()

        # Вызываем метод конвертации
        converted_files = self.converter.convert_files()

        # Проверяем результат
        self.assertEqual(len(converted_files), 1)
        self.assertTrue(os.path.exists(converted_files[0]))

    def test_convert_files_empty(self):
        # Проверяем пустой список файлов
        self.assertEqual(self.converter.convert_files(), [])


if __name__ == '__main__':
    unittest.main()
