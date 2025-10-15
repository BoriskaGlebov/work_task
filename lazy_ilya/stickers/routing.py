from django.urls import re_path

from stickers import consumers

websocket_urlpatterns = [
    re_path(r"ws/stickers/(?P<user_id>\d+)/$", consumers.StickyNoteConsumer.as_asgi()),
    re_path(r"ws/tasks/(?P<user_id>\d+)/$", consumers.TaskConsumer.as_asgi()),
]