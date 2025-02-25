import os
import sys
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv
from loguru import logger

load_dotenv()


@dataclass
class ProjectSettings:
    """
    Класс получения базовых настроек для парсера.

    Attributes:
        base_dir (str): Путь к базовой директории, загружается из переменной окружения BASE_PATH.
                        Тип: str. По умолчанию: значение из os.getenv("BASE_PATH").
        tlg_dir (str): Путь к директории TLG, загружается из переменной окружения TLG_PATH.
                        Тип: str. По умолчанию: значение из os.getenv("TLG_PATH").
    """

    base_dir: Optional[str] = os.getenv("BASE_PATH")
    tlg_dir: Optional[str] = os.getenv("TLG_PATH")


def user_filter(record: dict) -> bool:
    """
    Фильтр для логгера, проверяющий наличие ключа "user" в extra данных.

    Args:
        record (dict): Запись лога, представляющая собой словарь.

    Returns:
        bool: True, если ключ "user" присутствует в record["extra"], иначе False.
    """
    return "user" in record["extra"]


def filename_filter(record: dict) -> bool:
    """
    Фильтр для логгера, проверяющий наличие ключа "filename" в extra данных.

    Args:
        record (dict): Запись лога, представляющая собой словарь.

    Returns:
        bool: True, если ключ "filename" присутствует в record["extra"], иначе False.
    """
    return "filename" in record["extra"]


# Удаляем все существующие обработчики
logger.remove()

# Настройка логирования для stdout
logger.add(
    sys.stdout,
    level="DEBUG",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> - "
    "<level>{level:^8}</level> - "
    "<cyan>{name}</cyan>:<magenta>{line}</magenta> - "
    "<yellow>{function}</yellow> - "
    "<white>{message}</white> <magenta>{extra[filename]:^10}</magenta>",
    filter=filename_filter,
    catch=True,
    diagnose=True,
    enqueue=True,  # Добавлено для асинхронной обработки
)

# Конфигурация логгера с дополнительными полями
logger.configure(extra={"ip": "", "user": "", "filename": ""})

# Настройка логирования в файл
settings = ProjectSettings()
log_file_path = os.path.join(settings.base_dir or ".", "file.log")  # Обработка None

logger.add(
    log_file_path,
    level="ERROR",
    format="{time:YYYY-MM-DD HH:mm:ss} - {level} - {name}:{line} - {function} - {message} {extra[filename]}",
    rotation="1 day",
    retention="7 days",
    catch=True,
    backtrace=True,
    diagnose=True,
    filter=filename_filter,
    enqueue=True,  # Добавлено для асинхронной обработки
)

# Теперь вы можете использовать logger в других модулях
# Явный экспорт для того что б mypy не ругался
__all__ = ["logger", "ProjectSettings"]

if __name__ == "__main__":
    s = ProjectSettings()
    print(s.tlg_dir)
    logger.error("Сообщение об ошибке")
    logger.bind(filename="имя_файла").error("Сообщение об ошибке с именем файла")
