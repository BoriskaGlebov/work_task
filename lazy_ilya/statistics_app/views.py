from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import View

from file_creator.models import Counter


# Create your views here.
def base_view(request: HttpRequest):
    return render(request, 'statistics_app/statistics_app.html')


class StatisticsApp(LoginRequiredMixin, View):
    login_url = reverse_lazy("statistics_app:statistics_app")

    def get(self, request: HttpRequest) -> HttpResponse:
        """
        """
        counters = Counter.objects.all()
        print(counters)

        # Общее количество файлов
        total_files = counters.aggregate(total=Sum('num_files'))['total'] or 0

        # Самый продуктивный день (группировка по дате)
        best_day_data = (
            counters.annotate(day=TruncDate('processed_at'))
            .values('day')
            .annotate(total=Sum('num_files'))
            .order_by('-total')
            .first()
        )

        best_day = best_day_data['day'] if best_day_data else None
        best_day_total = best_day_data['total'] if best_day_data else 0

        # Кружки кофе (2 файла = 1 кружка)
        coffee_cups = total_files // 2

        return render(request, 'statistics_app/statistics_app.html', {
            'total_files': total_files,
            'best_day': best_day,
            'best_day_total': best_day_total,
            'coffee_cups': coffee_cups,
        })
