import json
from msilib import Table

from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User

from cities.models import CityData, CounterCities, TableNames
from myauth.models import CustomUser


class CitiesViewTest(TestCase):
    def setUp(self):
        # Создаем пользователя и логинимся
        self.user = CustomUser.objects.create_user(
            username="testuser", password="testpass", phone_number="+79852000338"
        )
        self.client = Client()
        self.client.login(username="testuser", password="testpass")

        tabl = TableNames.objects.create(table_name="Таблица1")
        # Создаем объект CityData для тестов
        self.city = CityData.objects.create(
            table_id=tabl,
            dock_num=100,
            location="Old Location",
            name_organ="Old Organ",
            pseudonim="OldPseud",
            ip_address="127.0.0.1",
            work_time="9-18",
            some_number="123",
            letters=False,
            writing=False,
        )

    def test_get_cities(self):
        # Тест на GET-запрос
        url = reverse("cities:base_template")  # замените на свой url
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "cities/cities.html")
        self.assertIn("is_admin", response.context)
        self.assertIn(
            "cities_json", response.context
        )  # предположим, что контекст содержит 'cities'

    def test_put_update_city_success(self):
        url = reverse(
            "cities:edit_city", args=[self.city.table_id.id, self.city.dock_num]
        )
        data = {
            "location": "New Location",
            "name_organ": "New Organ",
            "pseudonim": "NewPseud",
            "ip_address": "192.168.0.1",
            "work_time": "8-17",
            "some_number": "456",
        }
        response = self.client.put(
            url, data=json.dumps(data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"status": "success"})

        # Проверяем, что данные обновились
        self.city.refresh_from_db()
        self.assertEqual(self.city.location, "New Location")
        self.assertEqual(self.city.name_organ, "New Organ")

    def test_put_update_city_not_found(self):
        url = reverse("cities:edit_city", args=["999", "999"])
        data = {}
        response = self.client.put(
            url, data=json.dumps(data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 404)
        self.assertJSONEqual(
            response.content, {"status": "error", "message": "Город не найден"}
        )

    def test_put_update_city_bad_json(self):
        url = reverse(
            "cities:edit_city", args=[self.city.table_id.pk, self.city.dock_num]
        )
        bad_json = "{bad json}"
        response = self.client.put(url, data=bad_json, content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(
            response.content, {"status": "error", "message": "Неверный формат JSON"}
        )

    @patch("cities.models.CounterCities.objects.get")
    def test_delete_city_success_with_counter(self, mock_counter_get):
        # Мокаем CounterCities для удаления
        counter = MagicMock(spec=CounterCities)
        mock_counter_get.return_value = counter

        url = reverse(
            "cities:delete_city", args=[self.city.table_id.id, self.city.dock_num]
        )
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"status": "success"})

        self.city.refresh_from_db()
        self.assertEqual(self.city.location, "")
        # Проверяем, что delete вызван у CounterCities
        counter.delete.assert_called_once()

    @patch(
        "cities.models.CounterCities.objects.get",
        side_effect=CounterCities.DoesNotExist,
    )
    def test_delete_city_success_without_counter(self, mock_counter_get):
        # CounterCities не найден, но удаление должно пройти успешно
        url = reverse(
            "cities:delete_city", args=[self.city.table_id.id, self.city.dock_num]
        )
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"status": "success"})

    def test_delete_city_not_found(self):
        url = reverse("cities:delete_city", args=[999, 999])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 404)
        self.assertJSONEqual(
            response.content, {"status": "error", "message": "Город не найден"}
        )
