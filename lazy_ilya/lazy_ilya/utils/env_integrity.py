from pathlib import Path
import hashlib
from django.core.exceptions import ImproperlyConfigured
from loguru import logger


ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
HASH_PATH = Path(__file__).resolve().parent.parent.parent / ".env.sha256"


def check_env_integrity() -> None:
    """
    Проверяет целостность файла .env по SHA256 хэшу.

    Если файл .env отсутствует, выбрасывает исключение ImproperlyConfigured.
    Если файл с хэшем отсутствует, создаёт его и записывает текущий хэш.
    Если текущий хэш .env не совпадает с сохранённым в файле хэшем,
    выбрасывает исключение ImproperlyConfigured.

    Исключения:
        ImproperlyConfigured: при отсутствии файла .env
                             или при несовпадении хэшей.
    """
    if not ENV_PATH.exists():
        logger.error("Файл .env не найден.")
        raise ImproperlyConfigured("Файл .env не найден.")

    with ENV_PATH.open("rb") as f:
        data: bytes = f.read()

    current_hash: str = hashlib.sha256(data).hexdigest()

    if not HASH_PATH.exists():
        HASH_PATH.write_text(current_hash)
        logger.info(f"Создан файл хэша: {HASH_PATH.name}")
        return

    stored_hash: str = HASH_PATH.read_text().strip()

    if current_hash != stored_hash:
        logger.bind(user="Илюха!!!").error(
            "Файл .env был изменён! Хэш не совпадает. Попался!!!!"
        )
        raise ImproperlyConfigured(
            "Файл .env был изменён! Хэш не совпадает. Попался!!!"
        )
