import os
import sys
from dataclasses import dataclass

from dotenv import load_dotenv
from loguru import logger

load_dotenv()


@dataclass
class ProjectSettings:
    """
    Класс получения базовых настроек для парсера.

    Attributes:
        base_dir (str): Путь к базовой директории, загружается из переменной окружения BASE_PATH.
        tlg_dir (str): Путь к директории TLG, загружается из переменной окружения TLG_PATH.
    """
    base_dir: str = os.getenv('BASE_PATH')
    tlg_dir: str = os.getenv('TLG_PATH')


# Удаляем все существующие обработчики
logger.remove()

# Настройка логирования
logger.add(
    sys.stdout,
    level="DEBUG",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> - "
           "<level>{level:^8}</level> - "
           "<cyan>{name}</cyan>:<magenta>{line}</magenta> - "
           "<yellow>{function}</yellow> - "
           "<white>{message}</white> <magenta>{extra[user]:^10}</magenta>",
)
# Конфигурация логгера с дополнительными полями
logger.configure(extra={"ip": "", "user": ""})
logger.add(
    os.path.join(ProjectSettings.base_dir, "file.log"),
    level="ERROR",
    format="{time:YYYY-MM-DD HH:mm:ss} - {level} - {name}:{line} - {function} - {message} {extra[user]}",
    rotation="1 day",
    retention="7 days",
    backtrace=True,
    diagnose=True,
)

# Теперь вы можете использовать logger в других модулях
# Явный экспорт для того что б mypy не ругался
__all__ = ["logger","ProjectSettings"]

if __name__ == '__main__':
    s = ProjectSettings()
    print(s.tlg_dir)
    logger.error('sdf')
