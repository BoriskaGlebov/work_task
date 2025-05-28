import os
import tempfile
import unittest
from spire.doc import Document, FileFormat

from file_creator.utils.custom_converter.converter_to_docx import Converter


class TestConverter(unittest.TestCase):
    def setUp(self):
        # Создаем временную директорию для тестов
        self.temp_dir = tempfile.TemporaryDirectory()

        # Пути тестовых файлов
        self.doc_path = os.path.join(self.temp_dir.name, "test_doc.doc")
        self.rtf_path = os.path.join(self.temp_dir.name, "test_rtf.rtf")
        self.txt_path = os.path.join(self.temp_dir.name, "skip.txt")
        self.docx_path = os.path.join(self.temp_dir.name, "already.docx")

        # Создаем .doc файл с текстом
        doc = Document()
        section = doc.AddSection()
        paragraph = section.AddParagraph()
        paragraph.AppendText("Тестовый документ .doc")
        doc.SaveToFile(self.doc_path, FileFormat.Doc)

        # Создаем .rtf файл с текстом
        rtf = Document()
        rtf_sec = rtf.AddSection()
        rtf_par = rtf_sec.AddParagraph()
        rtf_par.AppendText("Тестовый документ .rtf")
        rtf.SaveToFile(self.rtf_path, FileFormat.Rtf)

        # Создаем файлы, которые должны игнорироваться
        with open(self.txt_path, "w", encoding="utf-8") as f:
            f.write("Текстовый файл, должен игнорироваться")
        with open(self.docx_path, "w", encoding="utf-8") as f:
            f.write("Документ .docx, должен игнорироваться")

    def tearDown(self):
        # Удаляем временную директорию и все в ней
        self.temp_dir.cleanup()

    def test_all_files_excludes_txt_docx(self):
        converter = Converter(self.temp_dir.name)
        files = converter.all_files()
        self.assertIn("test_doc.doc", files)
        self.assertIn("test_rtf.rtf", files)
        self.assertNotIn("skip.txt", files)
        self.assertNotIn("already.docx", files)

    def test_convert_files_creates_docx(self):
        converter = Converter(self.temp_dir.name)
        converted_files = converter.convert_files()

        # Проверяем, что конвертация прошла и появились файлы .docx
        expected_docx_doc = os.path.join(self.temp_dir.name, "test_doc.docx")
        expected_docx_rtf = os.path.join(self.temp_dir.name, "test_rtf.docx")

        self.assertIn(expected_docx_doc, converted_files)
        self.assertIn(expected_docx_rtf, converted_files)

        # Проверяем, что файлы действительно созданы
        self.assertTrue(os.path.exists(expected_docx_doc))
        self.assertTrue(os.path.exists(expected_docx_rtf))

        # Дополнительно можно проверить, что файл .docx имеет ненулевой размер
        self.assertGreater(os.path.getsize(expected_docx_doc), 0)
        self.assertGreater(os.path.getsize(expected_docx_rtf), 0)
