import json

from channels.generic.websocket import AsyncWebsocketConsumer

from .utils.my_settings.settings_for_app import logger


class ProgressConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer для отправки обновлений прогресса клиентам.

    Этот класс управляет подключениями WebSocket и отправляет обновления прогресса
    в реальном времени.
    """

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

    async def send_progress(self, event: dict) -> None:
        """
        Отправляет обновление прогресса клиенту через WebSocket.

        Args:
            event (dict): Словарь, содержащий данные события, включая 'progress' и, возможно, 'cities'.

        Обрабатывает отправку данных о прогрессе и городах (если они есть) клиенту.
        """
        if self.scope["type"] == "websocket":
            try:
                progress: int = event["progress"]
                logger.info(f"Отправка прогресса клиенту: {progress}%")

                # Формируем ответ с данными о прогрессе
                response_data: dict = {
                    "progress": progress,
                }

                if "cities" in event:
                    response_data["cities"] = event[
                        "cities"
                    ]  # Добавляем города в ответ

                await self.send(text_data=json.dumps(response_data))
            except Exception as e:
                logger.error(f"Ошибка при отправке сообщения: {e}")
