import json
from unittest import TestCase
from unittest.mock import Mock

from django.contrib.auth.models import User, Group
from django.test import RequestFactory, TestCase as DjangoTestCase
from django.utils.timezone import now

from cities.models import TableNames, CityData
from cities.utils.common_func.get_city_context import get_all_cities, get_context_admin_cities
from myauth.models import CustomUser


class GetCitiesTestCase(DjangoTestCase):
    def setUp(self):
        self.factory = RequestFactory()

        # Создаем таблицу
        self.table = TableNames.objects.create(table_name="Test Table")

        # Создаем записи CityData
        CityData.objects.create(
            table_id=self.table,
            dock_num=1,
            location="Москва",
            name_organ="Орган 1",
            pseudonim="Псевдо 1",
            letters=True,
            writing=False,
            ip_address="127.0.0.1",
            some_number="1234",
            work_time="09:00–18:00",
        )
        CityData.objects.create(
            table_id=self.table,
            dock_num=2,
            location=None,
            name_organ="Орган 2",
        )  # Этот не должен попасть

        # Создаем пользователя
        self.user = CustomUser.objects.create_user(username="user1", password="1234",phone_number="+79852000338")
        self.admin = CustomUser.objects.create_superuser(username="admin", password="admin", email="admin@example.com",phone_number="+79852000339")

        self.admin_group = Group.objects.create(name="admins")
        self.ilia_group = Group.objects.create(name="ilia-group")

    def test_get_all_cities_as_superuser(self):
        request = self.factory.get("/")
        request.user = self.admin

        context = get_all_cities(request)

        self.assertIn("cities_json", context)
        cities = json.loads(context["cities_json"])
        self.assertEqual(len(cities), 1)  # Только одна запись с location
        self.assertEqual(cities[0]["location"], "Москва")
        self.assertTrue(context["is_admin"])
        self.assertFalse(context["is_ilia"])

    def test_get_all_cities_as_admin_group(self):
        self.user.groups.add(self.admin_group)
        request = self.factory.get("/")
        request.user = self.user

        context = get_all_cities(request)

        self.assertTrue(context["is_admin"])
        self.assertFalse(context["is_ilia"])

    def test_get_all_cities_as_ilia_group(self):
        self.user.groups.add(self.ilia_group)
        request = self.factory.get("/")
        request.user = self.user

        context = get_all_cities(request)

        self.assertFalse(context["is_admin"])
        self.assertTrue(context["is_ilia"])

    def test_get_all_cities_as_regular_user(self):
        request = self.factory.get("/")
        request.user = self.user

        context = get_all_cities(request)

        self.assertFalse(context["is_admin"])
        self.assertFalse(context["is_ilia"])


class GetContextAdminCitiesTestCase(DjangoTestCase):
    def setUp(self):
        TableNames.objects.create(table_name="Table 1")
        TableNames.objects.create(table_name="Table 2")

    def test_get_context_admin_cities(self):
        context = get_context_admin_cities()

        self.assertIn("table_name", context)
        self.assertEqual(len(context["table_name"]), 2)
        names = [t["table_name"] for t in context["table_name"]]
        self.assertIn("Table 1", names)
        self.assertIn("Table 2", names)
