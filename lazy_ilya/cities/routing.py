from django.urls import re_path

from .consumers import UploadProgressConsumer

websocket_urlpatterns = [
    re_path(r"ws/upload/$", UploadProgressConsumer.as_asgi()),
]
