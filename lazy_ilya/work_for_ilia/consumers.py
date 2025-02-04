import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils.my_settings.disrs_for_app import logger


class ProgressConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("Метод connect вызван")
        self.group_name = 'progress_updates'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        logger.info(f"Клиент подключен к группе: {self.group_name}")

    async def send_progress(self, event):
        if self.scope["type"] == "websocket":
            try:
                progress = event['progress']
                logger.info(f"Отправка прогресса клиенту: {progress}%")

                # Отправляем прогресс и список городов (если есть)
                response_data = {
                    'progress': progress,
                }

                if 'cities' in event:
                    response_data['cities'] = event['cities']  # Добавляем города в ответ

                await self.send(text_data=json.dumps(response_data))
            except Exception as e:
                logger.error(f"Ошибка при отправке сообщения: {e}")
