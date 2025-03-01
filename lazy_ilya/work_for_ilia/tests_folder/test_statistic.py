from datetime import datetime, timedelta

from django.contrib.auth.models import User
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.http import HttpRequest, HttpResponse
from django.test import RequestFactory, TestCase
from django.urls import reverse
from work_for_ilia.models import Counter
from work_for_ilia.views import Statistic


class TestStatisticView(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.view = Statistic.as_view()
        self.user = User.objects.create(username="admin", password="12345")
        self.user.is_superuser = True
        self.user.save()

    def test_get_request(self):
        # Создаем запрос
        request = self.factory.get(
            reverse("work_for_ilia:statistics")
        )  # Укажите правильное имя URL
        request.user=self.user
        response = self.view(request)

        # Проверяем статус ответа
        self.assertEqual(response.status_code, 200)

    def test_context(self):
        # Создаем тестовые данные
        Counter.objects.create(num_files=10, processed_at=datetime.now())
        Counter.objects.create(
            num_files=5, processed_at=datetime.now() - timedelta(days=1)
        )

        # Создаем запрос
        request = self.factory.get(
            reverse("work_for_ilia:statistics")
        )  # Укажите правильное имя URL
        request.user=self.user
        response = self.view(request)
        self.assertIsInstance(response, HttpResponse)  # Проверка типа ответа
        content = response.content.decode("utf-8")  # Прочитать содержимое ответа
        # Дальше вы можете парсить содержимое в зависимости от его формата
        # Проверяем контекст
        self.assertIn("converted_files", content)
        self.assertIn("hard_day", content)
        self.assertIn("coffee_drunk", content)

    def test_total_files(self):
        # Создаем тестовые данные
        Counter.objects.create(num_files=10, processed_at=datetime.now())
        Counter.objects.create(
            num_files=5, processed_at=datetime.now() - timedelta(days=1)
        )

        # Создаем запрос
        request = self.factory.get(
            reverse("work_for_ilia:statistics")
        )  # Укажите правильное имя URL
        request.user=self.user
        response = self.view(request)
        self.assertIsInstance(response, HttpResponse)  # Проверка типа ответа
        content = response.content.decode("utf-8")  # Прочитать содержимое ответа
        # Проверяем общее количество файлов
        total_files = Counter.objects.aggregate(total=Sum("num_files"))["total"] or 0
        self.assertIn('&quot;converted_files&quot;: &quot;15&quot', content)

    def test_max_day(self):
        # Создаем тестовые данные
        Counter.objects.create(num_files=10, processed_at=datetime.now())
        Counter.objects.create(
            num_files=5, processed_at=datetime.now() - timedelta(days=1)
        )

        # Создаем запрос
        request = self.factory.get(
            reverse("work_for_ilia:statistics")
        )  # Укажите правильное имя URL
        request.user=self.user
        response = self.view(request)
        self.assertIsInstance(response, HttpResponse)
        content = response.content.decode("utf-8")
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
        self.assertIn(f'&quot;max_day_files&quot;: &quot;{max_total_files}&quot', content)
        self.assertIn(f'&quot;max_date&quot;: &quot;{formatted_date}&quot', content)

    def test_coffee(self):
        # Создаем тестовые данные
        Counter.objects.create(num_files=10, processed_at=datetime.now())
        Counter.objects.create(
            num_files=5, processed_at=datetime.now() - timedelta(days=1)
        )



        # Создаем запрос
        request = self.factory.get(
            reverse("work_for_ilia:statistics")
        )  # Укажите правильное имя URL
        request.user=self.user
        response = self.view(request)
        self.assertIsInstance(response, HttpResponse)
        content = response.content.decode("utf-8")
        # Проверяем количество кофе
        total_files = Counter.objects.aggregate(total=Sum("num_files"))["total"] or 0
        coffee = total_files // 2
        self.assertIn(f'&quot;amount&quot;: &quot;{coffee}&quot;', content)
