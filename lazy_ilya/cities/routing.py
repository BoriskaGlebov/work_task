from django.urls import re_path

from .consumers import UploadProgressConsumer

websocket_urlpatterns = [
    re_path(r"ws/upload/$", UploadProgressConsumer.as_asgi()),
    # re_path(r"ws/progress/$", ProgressConsumer.as_asgi()),
    # re_path(
    #     r"ws/download_progress/$", DownloadProgressConsumer.as_asgi()
    # ),  # Новый consumer для скачивания
]
