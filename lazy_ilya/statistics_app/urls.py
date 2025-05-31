from django.urls import path

from statistics_app.views import StatisticsApp

app_name = "statistics_app"
urlpatterns = [
    path("", StatisticsApp.as_view(), name="statistics_app"),
]
