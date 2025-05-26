import asyncio
import json
import os
import queue
import threading
import time
from typing import Any, Callable, Dict, Optional

from channels.generic.websocket import AsyncWebsocketConsumer

from lazy_ilya.utils.settings_for_app import logger
from .utils.parser_word.globus_parser import GlobusParser


class UploadProgressConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer для отправки клиенту обновлений прогресса обработки файлов.

    Клиенты подключаются к группе `progress_updates`, чтобы получать сообщения
    с обновлением прогресса в формате JSON.

    Атрибуты:
        group_name (str): Имя группы WebSocket, к которой подключается клиент.
    """

    group_name: str

    async def connect(self) -> None:
        """
        Обрабатывает подключение клиента к WebSocket.

        Проверяет, авторизован ли пользователь, логирует событие и добавляет
        клиента в группу `progress_updates`.
        """
        user = self.scope["user"]
        if user.is_authenticated:
            logger.bind(user=user.username).info(f"Пользователь {user.username} подключен к WebSocket")
        else:
            logger.info("Анонимный пользователь подключен к WebSocket")

        self.group_name = "progress_updates"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.bind(user=user.username).info(f"Клиент подключен к группе: {self.group_name}")

    async def disconnect(self, close_code: int) -> None:
        """
        Обрабатывает отключение клиента от WebSocket.

        Удаляет клиента из группы `progress_updates`.

        Args:
            close_code (int): Код закрытия WebSocket-соединения.
        """
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"Клиент отключился от WebSocket: {self.group_name}")

    async def send_progress(self, event: dict) -> None:
        """
        Отправляет клиенту данные об обновлении прогресса.

        Args:
            event (dict): Словарь события, содержащий ключ 'progress' с данными для отправки.
        """
        progress_data = event.get("progress", {})
        await self.send(text_data=json.dumps(progress_data))
        logger.debug(f"Отправлено обновление прогресса: {progress_data}")
