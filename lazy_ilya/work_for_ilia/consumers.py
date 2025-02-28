import asyncio
import json
import os
import queue
import threading
import time
from typing import Any, Callable, Dict, Optional

from channels.generic.websocket import AsyncWebsocketConsumer

from .utils.my_settings.settings_for_app import ProjectSettings, logger
from .utils.parser_word.globus_parser import GlobusParser


class ProgressConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer для отправки обновлений прогресса клиентам.

    Этот класс управляет подключениями WebSocket и отправляет обновления прогресса
    в реальном времени.
    """

    group_name: str  # Имя группы Channel Layer, к которой присоединяются клиенты.

    async def connect(self) -> None:
        """
        Обрабатывает подключение клиента к WebSocket.

        Добавляет клиента в группу для получения обновлений прогресса и принимает соединение.
        """
        logger.info("Метод connect вызван")
        self.group_name = "progress_updates"

        # Добавляем клиента в группу
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()
        logger.info(f"Клиент подключен к группе: {self.group_name}")

    async def send_progress(self, event: Dict[str, Any]) -> None:
        """
        Отправляет обновление прогресса клиенту через WebSocket.

        Args:
            event (Dict[str, Any]): Словарь, содержащий данные события, включая 'progress' и, возможно, 'cities'.

        Обрабатывает отправку данных о прогрессе и городах (если они есть) клиенту.
        """
        if self.scope["type"] == "websocket":
            try:
                progress: int = event["progress"]
                logger.info(f"Отправка прогресса клиенту: {progress}%")

                # Формируем ответ с данными о прогрессе
                response_data: Dict[str, Any] = {
                    "progress": progress,
                }

                if "cities" in event:
                    response_data["cities"] = event[
                        "cities"
                    ]  # Добавляем города в ответ

                await self.send(text_data=json.dumps(response_data))
            except Exception as e:
                logger.error(f"Ошибка при отправке сообщения: {e}")

    async def disconnect(self, close_code: int) -> None:
        """
        Обрабатывает отключение клиента от WebSocket.

        Args:
            close_code (int): Код закрытия соединения.

        Удаляет клиента из группы и логирует отключение.
        """
        logger.info(f"Client disconnected with close code: {close_code}")
        await self.channel_layer.group_discard(self.group_name, self.channel_name)


class DownloadProgressConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer для отслеживания прогресса скачивания файла.
    """

    group_name: str  # Имя группы Channel Layer.

    async def connect(self) -> None:
        """
        Обрабатывает подключение клиента к WebSocket.
        """
        await self.accept()
        self.group_name = "download_progress"
        await self.channel_layer.group_add(self.group_name, self.channel_name)

    async def receive(self, text_data: str) -> None:
        """
        Обрабатывает входящие сообщения от клиента.

        Args:
            text_data (str): JSON строка с данными от клиента.
        """
        text_data_json: Dict[str, Any] = json.loads(text_data)
        task: Optional[str] = text_data_json.get("task")

        if task == "start_download":
            await self.start_download()

    async def start_download(self) -> None:
        """
        Запускает процесс создания файла в отдельном потоке.
        """
        thread: threading.Thread = threading.Thread(target=self.generate_file)
        thread.start()

    def generate_file(self) -> None:
        """
        Генерирует файл с использованием `GlobusParser` и отправляет обновления прогресса.
        """
        GlobusParser.create_globus(send_progress=self.send_progress_to_channel)

    def send_progress_to_channel(self, progress: int) -> None:
        """
        Отправляет данные о прогрессе в Channel Layer.

        Args:
            progress (int): Процент прогресса (0-100).
        """

        async def send_progress() -> None:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "send_progress",
                    "progress": progress,
                },
            )

        loop: asyncio.AbstractEventLoop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(send_progress())

    async def send_progress(self, event: Dict[str, Any]) -> None:
        """
        Отправляет данные о прогрессе клиенту через WebSocket.

        Args:
            event (Dict[str, Any]): Словарь, содержащий данные события, включая 'progress' и 'file_url'.
        """
        progress: int = event["progress"]
        file_url: Optional[str] = "download/" if progress == 100 else None

        await self.send(
            text_data=json.dumps({"progress": progress, "file_url": file_url})
        )

    async def disconnect(self, close_code: int) -> None:
        """
        Обрабатывает отключение клиента от WebSocket.

        Args:
            close_code (int): Код закрытия соединения.
        """
        logger.info(
            f"Client disconnected from download progress with close code: {close_code}"
        )
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
