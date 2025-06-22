import json
import tempfile
from unittest.mock import MagicMock, patch, mock_open

from django.test import TestCase
from django.urls import reverse

from file_creator.models import Counter
from myauth.models import CustomUser  # замените на свой путь, если отличается


class UploadViewTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="testuser", password="12345"
        )
        self.client.login(username="testuser", password="12345")
        self.url = reverse(
            "file_creator:file-creator-start"
        )  # убедись, что имя маршрута правильное

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "file_creator/file_creator.html")

    def test_post_no_files(self):
        response = self.client.post(self.url, {"start_number": "1"}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(response.content, {"error": "Нет загруженных файлов"})

    def test_post_invalid_start_number(self):
        mock_file = MagicMock()
        mock_file.name = "test.docx"
        with tempfile.NamedTemporaryFile(suffix=".docx") as tmp:
            tmp.write(b"data")
            tmp.seek(0)
            response = self.client.post(
                self.url, {"start_number": "0", "files": tmp}, format="multipart"
            )
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(
            response.content, {"error": "Номер документа должен быть больше нуля"}
        )

    @patch("file_creator.views.Converter")
    @patch("file_creator.views.Parser")
    @patch("file_creator.views.os")
    @patch("file_creator.views.OverwritingFileSystemStorage")
    def test_post_success(self, mock_storage, mock_os, mock_parser, mock_converter):
        # Настройка моков
        mock_storage.return_value.save.side_effect = ["first.docx", "second.docx"]
        str1 = b"data1"
        str2 = b"data2"
        mock_parser.return_value.create_file_parsed.return_value = [
            f"Содержимое документа 1 {str1}",
            f"Содержимое документа 2 {str2}",
        ]
        mock_os.listdir.return_value = ["first.docx", "second.docx"]
        mock_os.path.isfile.return_value = True
        mock_os.path.join.side_effect = lambda a, b: f"{a}/{b}"
        mock_os.path.splitext.side_effect = lambda x: (
            "d" + x.rsplit(".", 1)[0],
            ".txt",
        )

        # Создание двух временных файлов
        with tempfile.NamedTemporaryFile(
            suffix=".docx"
        ) as tmp1, tempfile.NamedTemporaryFile(suffix=".docx") as tmp2:
            tmp1.write(b"data1")
            tmp1.seek(0)
            tmp1.name = "first.docx"  # Назначаем имя вручную

            tmp2.write(b"data2")
            tmp2.seek(0)
            tmp2.name = "second.docx"

            with patch(
                "file_creator.views.ProjectSettings.tlg_dir", tempfile.gettempdir()
            ):
                response = self.client.post(
                    self.url,
                    {
                        "start_number": "1",
                        "files": [tmp1, tmp2],  # Передача списка файлов
                    },
                    format="multipart",
                )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn("new_files", data)
        self.assertEqual(data["new_files"], ["1_first.txt", "2_second.txt"])

    def test_put_invalid_json(self):
        response = self.client.put(
            self.url, data="invalid json", content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(
            response.content, {"error": "Неверный формат данных. - JSONDecodeError"}
        )

    @patch("file_creator.views.replace_unsupported_characters", lambda s: s)
    @patch("file_creator.views.open", new_callable=mock_open)
    @patch("file_creator.views.Counter.objects.create")
    def test_put_success(self, mock_create, mock_open):
        mock_instance = MagicMock()
        mock_create.return_value = mock_instance
        mock_instance.save.return_value = None

        data = {"files": ["file1.txt", "file2.txt"], "content": ["hello", "world"]}

        with patch("file_creator.views.ProjectSettings.tlg_dir", tempfile.gettempdir()):
            response = self.client.put(
                self.url, data=json.dumps(data), content_type="application/json"
            )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(
            response.content,
            {"status": "success", "message": "Все файлы успешно сохранены."},
        )
