from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User, Group
from unittest.mock import patch

import json

from cities.models import CityData, TableNames
from myauth.models import CustomUser


class CityInfoViewTests(TestCase):
    def setUp(self):
        # Создаем пользователя и группу admin
        self.admin_group = Group.objects.create(name="admin")
        self.admin_user = CustomUser.objects.create_user(
            username="adminuser", password="pass", phone_number="+79852000338"
        )
        self.admin_user.groups.add(self.admin_group)
        self.admin_user.save()

        self.regular_user = CustomUser.objects.create_user(
            username="regularuser", password="pass", phone_number="+79852000558"
        )

        self.client = Client()
        self.url = reverse("cities:city_info")  # Замени на правильный путь в urls.py
        tbl = TableNames.objects.create(table_name="Таблица1")
        # Создаем тестовый объект CityData
        self.city = CityData.objects.create(
            dock_num=1,
            table_id=tbl,
            location="Location 1",
            name_organ="Organ 1",
            pseudonim="Pseudo 1",
            letters=False,
            writing=True,
            ip_address="192.168.1.1",
            some_number=123,
            work_time="9-18",
        )

    def test_access_denied_for_anonymous(self):
        # Неавторизованный пользователь должен получить редирект на логин
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)
        self.assertIn("login", response.url)

    def test_access_denied_for_non_admin(self):
        # Авторизованный пользователь без группы admin получает 403
        self.client.login(username="regularuser", password="pass")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)
        self.assertIn("Доступ запрещён", response.content.decode())

    def test_get_existing_city_by_dock_num(self):
        self.client.login(username="adminuser", password="pass")
        response = self.client.get(self.url, {"dock_num": 1, "table_id": 1})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["found"])
        self.assertEqual(data["data"]["location"], "Location 1")

    def test_get_nonexistent_city_returns_found_false(self):
        self.client.login(username="adminuser", password="pass")
        response = self.client.get(self.url, {"dock_num": 999, "table_id": 1})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["found"])

    def test_get_next_num_when_no_dock_num(self):
        self.client.login(username="adminuser", password="pass")
        response = self.client.get(self.url, {"table_id": "1"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["last_num"], 2)  # Потому что есть dock_num=1

    def test_post_create_city_success(self):
        self.client.login(username="adminuser", password="pass")
        new_city_data = {
            "dock_num": 2,
            "table_id": 1,
            "location": "New Location",
            "name_organ": "New Organ",
            "pseudonim": "New Pseudo",
            "letters": "XYZ",
            "writing": "New Writing",
            "ip_address": "10.0.0.1",
            "some_number": 456,
            "work_time": "10-19",
        }
        response = self.client.post(
            self.url, data=json.dumps(new_city_data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        resp_data = response.json()
        self.assertTrue(resp_data.get("created"))
        self.assertIsInstance(resp_data.get("id"), int)
        self.assertTrue(CityData.objects.filter(dock_num=2, table_id=1).exists())

    def test_post_create_city_validation_error(self):
        self.client.login(username="adminuser", password="pass")
        invalid_data = {
            # Отсутствуют обязательные поля (например dock_num)
            "table_id": 1,
            "some_number": "asd",
        }
        response = self.client.post(
            self.url, data=json.dumps(invalid_data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        resp_data = response.json()
        self.assertIn("errors", resp_data)

    def test_put_update_city_success(self):
        self.client.login(username="adminuser", password="pass")
        update_data = {
            "dock_num": 1,
            "table_id": 1,
            "location": "Updated Location",
            "name_organ": "Updated Organ",
            "pseudonim": "Updated Pseudo",
            "letters": False,
            "writing": True,
            "ip_address": "192.168.1.100",
            "some_number": 789,
            "work_time": "8-17",
        }
        response = self.client.put(
            self.url, data=json.dumps(update_data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        resp_data = response.json()
        self.assertTrue(resp_data.get("updated"))

        updated_obj = CityData.objects.get(dock_num=1, table_id=1)
        self.assertEqual(updated_obj.location, "Updated Location")

    def test_put_update_city_not_found(self):
        self.client.login(username="adminuser", password="pass")
        update_data = {"dock_num": 999, "table_id": 1, "location": "Does not exist"}
        response = self.client.put(
            self.url, data=json.dumps(update_data), content_type="application/json"
        )
        self.assertEqual(response.status_code, 404)
        resp_data = response.json()
        self.assertIn("errors", resp_data)
