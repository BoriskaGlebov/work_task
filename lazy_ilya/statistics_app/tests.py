from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils.timezone import now, timedelta

from file_creator.models import Counter
from cities.models import CounterCities, TableNames, CityData

User = get_user_model()


class StatisticsAppTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Создаём пользователя
        cls.user = User.objects.create_user(username="testuser", password="password123")

        # Данные для модели Counter (2 дня по 5 и 10 файлов)
        cls.date1 = now().date()
        cls.date2 = (now() - timedelta(days=1)).date()

        table1 = TableNames.objects.create(table_name="Test table name")
        city1 = CityData.objects.create(table_id=table1, dock_num=1, location="Город1")
        city2 = CityData.objects.create(table_id=table1, dock_num=2, location="Город2")
        city3 = CityData.objects.create(table_id=table1, dock_num=3, location="Город3")
        city4 = CityData.objects.create(table_id=table1, dock_num=4, location="Город4")
        Counter.objects.create(num_files=5, processed_at=cls.date1)
        Counter.objects.create(num_files=10, processed_at=cls.date2)

        # Данные для CounterCities
        CounterCities.objects.create(dock_num=city1, count_responses=12)
        CounterCities.objects.create(dock_num=city2, count_responses=8)
        CounterCities.objects.create(dock_num=city3, count_responses=5)
        CounterCities.objects.create(dock_num=city4, count_responses=3)

    def test_redirect_if_not_logged_in(self):
        """Пользователь без авторизации должен быть перенаправлен на логин"""
        response = self.client.get(reverse('statistics_app:statistics_app'))
        self.assertRedirects(response, f"{reverse('myauth:login')}?next={reverse('statistics_app:statistics_app')}")

    def test_logged_in_user_access(self):
        """Авторизованный пользователь получает доступ"""
        self.client.login(username="testuser", password="password123")
        response = self.client.get(reverse('statistics_app:statistics_app'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'statistics_app/statistics_app.html')

    def test_statistics_context_data(self):
        """Проверяем, что в контекст передаются корректные данные"""
        self.client.login(username="testuser", password="password123")
        response = self.client.get(reverse('statistics_app:statistics_app'))

        self.assertEqual(response.context['total_files'], 15)
        self.assertEqual(response.context['coffee_cups'], 7)
        self.assertIn('best_day', response.context)
        self.assertEqual(len(response.context['top_cities']), 3)
