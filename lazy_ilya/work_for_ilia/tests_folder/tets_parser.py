import datetime
import os
import shutil
import tempfile
import unittest
from unittest.mock import patch

from docx import Document
from work_for_ilia.utils.parser_word.my_parser import (  # Импортируйте класс Parser и функции
    Parser, can_encode, replace_unsupported_characters)


class TestParser(unittest.TestCase):

    def setUp(self):
        # Создаем временную директорию для тестов
        self.temp_dir = tempfile.mkdtemp()
        self.parser = Parser(self.temp_dir, 1)

    def tearDown(self):
        # Удаляем временную директорию после каждого теста
        shutil.rmtree(self.temp_dir)

    def create_docx_file(self, filename, content):
        """Создает docx файл с указанным содержимым."""
        file_path = os.path.join(self.temp_dir, filename)
        document = Document()
        document.add_paragraph(content)
        document.save(file_path)
        return file_path

    def test_init(self):
        # Проверяем инициализацию класса
        self.assertEqual(self.parser.directory, self.temp_dir)
        self.assertEqual(self.parser.start_number, 1)

    def test_all_files(self):
        # Создаем тестовые файлы
        self.create_docx_file("test1.docx", "Test content 1")
        self.create_docx_file("test2.docx", "Test content 2")
        with open(os.path.join(self.temp_dir, "test.txt"), "w") as f:
            f.write("Test content")

        # Проверяем список файлов .docx
        files = self.parser.all_files()
        self.assertIn("test1.docx", files)
        self.assertIn("test2.docx", files)
        self.assertNotIn("test.txt", files)

    def test_format_text(self):
        # Проверяем форматирование текста
        text = "This is a long text that needs to be formatted"
        formatted_text = self.parser.format_text(text, max_length=10)
        expected_text = "This is a\nlong text\nthat needs\nto be\nformatted"
        self.assertEqual(formatted_text, expected_text)

    def test_create_file_parsed(self):
        # Создаем тестовый файл .docx
        file_path = self.create_docx_file("test.docx", "Test content")

        # Вызываем метод создания файла
        parsed_files = self.parser.create_file_parsed()

        # Проверяем результат
        self.assertEqual(len(parsed_files), 1)

        self.assertIn("TEST CONTENT", parsed_files[0])

    def test_replace_unsupported_characters(self):
        # Проверяем замену неподдерживаемых символов
        text = "Hello, мир!«»№"
        replaced_text = replace_unsupported_characters(text)
        self.assertEqual(replaced_text, "Hello, мир!??№")

    def test_can_encode(self):
        # Проверяем возможность кодирования символа
        self.assertTrue(can_encode("A"))
        self.assertFalse(can_encode("«"))


if __name__ == "__main__":
    unittest.main()
