from django.urls import path

from work_for_ilia.views import Greater,Cities,Statistic

app_name = "work_for_ilia"
urlpatterns = [
    path('', Greater.as_view(), name='index'),
    path('update/', Greater.as_view(), name='update'),  # Добавьте этот маршру
    path('cities/',Cities.as_view(),name='cities'),
    path('statistics/',Statistic.as_view(),name='statistics')
]
