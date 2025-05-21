import json
from typing import List, Dict, Any

from django.db.models import Q
from django.http import HttpRequest

from cities.models import CityData


def get_all_cities(request: HttpRequest):
    is_admin: bool = request.user.is_superuser
    is_ilia: bool = False
    # Если не администратор, проверяем, состоит ли в группе
    if not is_admin:
        is_admin = request.user.groups.filter(name="admins").exists()
        is_ilia = request.user.groups.filter(name="ilia-group").exists()
    all_rows = CityData.objects.select_related("table_id").exclude(
        Q(location__isnull=True) | Q(location__exact="")
    )

    # Преобразуем данные в словарь для каждого города
    cities: List[Dict[str, Any]] = [row.to_dict() for row in all_rows]

    # Преобразуем данные в JSON
    cities_json: str = json.dumps(cities, ensure_ascii=False)
    context = {
        "cities_json": cities_json,
        "is_admin": is_admin,
        "is_ilia": is_ilia,
    }
    return context
