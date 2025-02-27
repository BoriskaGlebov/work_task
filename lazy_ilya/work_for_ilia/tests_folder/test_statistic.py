from django.test import TestCase, RequestFactory
from django.urls import reverse
from work_for_ilia.views import Statistic
from work_for_ilia.models import Counter
from django.http import HttpRequest, HttpResponse
from datetime import datetime, timedelta
from django.db.models import Sum
from django.db.models.functions import TruncDate


class TestStatisticView(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.view = Statistic.as_view()

    def test_get_request(self):
        # Создаем запрос
        request = self.factory.get(reverse('work_for_ilia:statistics'))  # Укажите правильное имя URL
        response = self.view(request)

        # Проверяем статус ответа
        self.assertEqual(response.status_code, 200)

    def test_context(self):
        # Создаем тестовые данные
        Counter.objects.create(num_files=10, processed_at=datetime.now())
        Counter.objects.create(num_files=5, processed_at=datetime.now() - timedelta(days=1))

        # Создаем запрос
        request = self.factory.get(reverse('work_for_ilia:statistics'))  # Укажите правильное имя URL
        response = self.view(request)
        self.assertIsInstance(response, HttpResponse)  # Проверка типа ответа
        content = response.content.decode('utf-8')  # Прочитать содержимое ответа
        # Дальше вы можете парсить содержимое в зависимости от его формата
        # Проверяем контекст
        self.assertIn('converted_files', content)
        self.assertIn('hard_day', content)
        self.assertIn('coffee_drunk', content)

    def test_total_files(self):
        # Создаем тестовые данные
        Counter.objects.create(num_files=10, processed_at=datetime.now())
        Counter.objects.create(num_files=5, processed_at=datetime.now() - timedelta(days=1))

        # Создаем запрос
        request = self.factory.get(reverse('work_for_ilia:statistics'))  # Укажите правильное имя URL
        response = self.view(request)
        self.assertIsInstance(response, HttpResponse)  # Проверка типа ответа
        content = response.content.decode('utf-8')  # Прочитать содержимое ответа
        # Проверяем общее количество файлов
        total_files = Counter.objects.aggregate(total=Sum("num_files"))["total"] or 0
        self.assertIn('"converted_files": "15"', content)

    def test_max_day(self):
        # Создаем тестовые данные
        Counter.objects.create(num_files=10, processed_at=datetime.now())
        Counter.objects.create(num_files=5, processed_at=datetime.now() - timedelta(days=1))

        # Создаем запрос
        request = self.factory.get(reverse('work_for_ilia:statistics'))  # Укажите правильное имя URL
        response = self.view(request)
        self.assertIsInstance(response, HttpResponse)
        content = response.content.decode('utf-8')
        # Проверяем день с максимальным количеством файлов
        daily_totals = (
            Counter.objects.annotate(date=TruncDate("processed_at"))
            .values("date")
            .annotate(total=Sum("num_files"))
            .order_by("-total")
        )
        if daily_totals:
            max_day = daily_totals[0]
            max_date = max_day["date"]
            max_total_files = max_day["total"]
        else:
            max_date = None
            max_total_files = 0
        # Предположим, что max_date — это объект datetime.date
        max_date = datetime.now().date()  # или любая другая дата
        formatted_date = max_date.strftime("%d - %m - %Y")
        self.assertIn('"max_day_files": "15"', content)
        self.assertIn(f'"max_date": "{formatted_date}"', content)

    def test_coffee(self):
        # Создаем тестовые данные
        Counter.objects.create(num_files=10, processed_at=datetime.now())
        Counter.objects.create(num_files=5, processed_at=datetime.now() - timedelta(days=1))

        # Создаем запрос
        request = self.factory.get(reverse('work_for_ilia:statistics'))  # Укажите правильное имя URL
        response = self.view(request)
        self.assertIsInstance(response, HttpResponse)
        content = response.content.decode('utf-8')
        # Проверяем количество кофе
        total_files = Counter.objects.aggregate(total=Sum("num_files"))["total"] or 0
        coffee = total_files // 2
        self.assertIn(f'"amount": "{coffee}"', content)
