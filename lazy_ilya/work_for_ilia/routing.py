from django.urls import re_path

from .consumers import DownloadProgressConsumer, ProgressConsumer

websocket_urlpatterns = [
    re_path(r"ws/progress/$", ProgressConsumer.as_asgi()),
    re_path(
        r"ws/download_progress/$", DownloadProgressConsumer.as_asgi()
    ),  # Новый consumer для скачивания
]
