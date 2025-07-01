from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import View

from cities.models import CounterCities
from file_creator.models import Counter
from stickers.models import StickyNote, Task


# Create your views here.
def base_view(request: HttpRequest):
    return render(request, "statistics_app/statistics_app.html")


class StatisticsApp(LoginRequiredMixin, View):
    login_url = reverse_lazy("myauth:login")

    def get(self, request: HttpRequest) -> HttpResponse:
        """ """
        counters = Counter.objects.all()

        # Общее количество файлов
        total_files = counters.aggregate(total=Sum("num_files"))["total"] or 0

        # Самый продуктивный день (группировка по дате)
        best_day_data = (
            counters.annotate(day=TruncDate("processed_at"))
            .values("day")
            .annotate(total=Sum("num_files"))
            .order_by("-total")
            .first()
        )

        best_day = best_day_data["day"] if best_day_data else None
        best_day_total = best_day_data["total"] if best_day_data else 0

        # Кружки кофе (2 файла = 1 кружка)
        coffee_cups = total_files // 2
        # ✅ Топ-3 самых популярных города по запросам
        top_cities = CounterCities.objects.select_related(
            "dock_num"
        ).order_by(  # Чтобы избежать дополнительных запросов
            "-count_responses"
        )[
            :3
        ]
        total_sticky_notes = StickyNote.objects.count()
        total_tasks = Task.objects.count()
        tasks_done = Task.objects.filter(done=True).count()
        tasks_in_progress = Task.objects.filter(done=False).count()

        return render(
            request,
            "statistics_app/statistics_app.html",
            {
                "total_files": total_files,
                "best_day": best_day,
                "best_day_total": best_day_total,
                "coffee_cups": coffee_cups,
                "top_cities": top_cities,  # 🔥 Передаём в шаблон
                "total_sticky_notes": total_sticky_notes,  # целое число
                "total_tasks": total_tasks,
                "tasks_in_progress": tasks_in_progress,
                "tasks_done": tasks_done,
            },
        )
