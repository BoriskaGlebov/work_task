from cities.models import CounterCities
from django.contrib.auth.views import redirect_to_login
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import View
from file_creator.models import Counter
from stickers.models import StickyNote, Task


# Create your views here.
def base_view(request: HttpRequest):
    return render(request, "statistics_app/statistics_app.html")


class StatisticsApp(View):
    login_url = reverse_lazy("myauth:login")

    def dispatch(self, request, *args, **kwargs):
        if request.method in ["PUT", "DELETE"]:
            if not request.user.is_authenticated:
                # Для обычного запроса — редирект
                if request.content_type == "text/html":
                    return redirect_to_login(request.get_full_path(), self.login_url)
                # Для JS/AJAX — 403 Forbidden
                return JsonResponse(
                    {"status": "error", "message": "Authentication required"},
                    status=403,
                )
        return super().dispatch(request, *args, **kwargs)

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
