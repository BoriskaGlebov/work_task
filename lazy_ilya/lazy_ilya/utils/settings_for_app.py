import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from loguru import logger
from lazy_ilya.settings import BASE_DIR

load_dotenv()


@dataclass
class ProjectSettings:
    """
    Класс для хранения настроек проекта.

    Атрибуты:
        base_dir: Основной каталог проекта.
        tlg_dir: Путь к папке Telegram (если задано в .env).
        log_dir: Путь к папке для логов.
        LOGGER_LEVEL_STDOUT: Уровень логирования для stdout.
        LOGGER_LEVEL_FILE: Уровень логирования для файлового лога.
        ALLOWED_PHONE_NUMBERS: Разрешенные номера телефонные сотрудников
    """

    base_dir: Optional[Path] = BASE_DIR
    tlg_dir: Optional[str] = Path(os.getenv("TLG_PATH")).resolve()
    log_dir: Optional[Path] = (
            BASE_DIR / "logs"
    )  # Используем Path для лучшей работы с путями
    LOGGER_LEVEL_STDOUT: Optional[str] = os.getenv(
        "LOGGER_LEVEL_STDOUT", "INFO"
    )  # Устанавливаем значение по умолчанию
    LOGGER_LEVEL_FILE: Optional[str] = os.getenv(
        "LOGGER_LEVEL_FILE", "DEBUG"
    )  # Устанавливаем значение по умолчанию
    ALLOWED_PHONE_NUMBERS: Optional[list] = os.getenv("ALLOWED_PHONE_NUMBERS")

    def __post_init__(self):
        raw_numbers = os.getenv("ALLOWED_PHONE_NUMBERS", "")
        self.ALLOWED_PHONE_NUMBERS = [
            phone.strip() for phone in raw_numbers.split(",") if phone.strip()
        ]


settings = ProjectSettings()


def user_filter(record: dict) -> bool:
    """
    Фильтр для логгера, проверяющий наличие ключа 'user' в extra данных.

    Args:
        record (dict): Запись лога.

    Returns:
        bool: True, если пользователь есть, иначе False.
    """
    return bool(record["extra"].get("user") and (record["extra"].get("user") != "-"))


def filename_filter(record: dict) -> bool:
    """
    Фильтр для логгера, проверяющий наличие ключа 'filename' в extra данных.

    Args:
        record (dict): Запись лога.

    Returns:
        bool: True, если имя файла есть, иначе False.
    """
    return bool(
        record["extra"].get("filename") and (record["extra"].get("filename") != "-")
    )


def default_filter(record: dict) -> bool:
    """
    Фильтр для логов без данных (если нет user и filename).

    Args:
        record (dict): Запись лога.

    Returns:
        bool: True, если ни user, ни filename нет, иначе False.
    """
    # Проверка, если нет user или filename
    if (record["extra"].get("user") == "-") or (not record["extra"].get("user")):
        return True
    elif (record["extra"].get("filename") == "-") or (
            not record["extra"].get("filename")
    ):
        return True
    else:
        return True


# Проверка наличия директории для логов и создание, если не существует
if not os.path.exists(settings.log_dir):
    os.makedirs(settings.log_dir)

# Удаляем все существующие обработчики для logger
logger.remove()

# Глобальная конфигурация extra (но она не будет работать, если bind не передаст данные)
logger.configure(extra={"user": "-", "filename": "-"})
# Добавляем обработчик для вывода в stdout
logger.add(
    sys.stdout,
    level=settings.LOGGER_LEVEL_STDOUT,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> - "
           "<level>{level:^8}</level> - "
           "<cyan>{name}</cyan>:<magenta>{line}</magenta> - "
           "<yellow>{function}</yellow> - "
           "<white>{message}</white> - "
           "<magenta>{extra[user]:^15}</magenta> - "
           "<magenta>{extra[filename]:^15}</magenta>",
    filter=lambda record: user_filter(record)
                          or filename_filter(record)
                          or default_filter(record),
    catch=True,
    diagnose=True,
    enqueue=True,
)

# Путь для файлового лога
log_file_path = settings.log_dir / "file.log"

# Добавляем обработчик для записи логов в файл
logger.add(
    log_file_path,
    level=settings.LOGGER_LEVEL_FILE,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> - "
           "<level>{level:^8}</level> - "
           "<cyan>{name}</cyan>:<magenta>{line}</magenta> - "
           "<yellow>{function}</yellow> - "
           "<white>{message}</white>"
           "<magenta>{extra[user]:^15}</magenta> - "
           "<magenta>{extra[filename]:^15}</magenta>",
    rotation="1 day",  # Ротация логов
    retention="7 days",  # Хранение логов 7 дней
    catch=True,
    backtrace=True,
    diagnose=True,
    filter=lambda record: user_filter(record)
                          or filename_filter(record)
                          or default_filter(record),
    enqueue=True,
)
# Экспортируем logger и ProjectSettings для использования в других модулях
__all__ = ["logger", "ProjectSettings"]

if __name__ == "__main__":
    logger.bind(user="Boris").debug("Сообщение")
    logger.bind(filename="Boris_file.txt").debug("Сообщение")
    logger.bind(user="Boris", filename="Boris_file.txt").warning("Сообщение")
    logger.debug("Сообщение")
    print(settings.ALLOWED_PHONE_NUMBERS)
