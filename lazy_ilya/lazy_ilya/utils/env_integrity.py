import hashlib
import os
from pathlib import Path
from lazy_ilya.utils.settings_for_app import logger

from django.core.exceptions import ImproperlyConfigured

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
HASH_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env.sha256"


def check_env_integrity():
    if not ENV_PATH.exists():
        logger.error("Файл .env не найден.")
        raise ImproperlyConfigured("Файл .env не найден.")
    with open(ENV_PATH, "rb") as f:
        data = f.read()
    current_hash = hashlib.sha256(data).hexdigest()

    if not HASH_PATH.exists():
        HASH_PATH.touch(exist_ok=True)
        HASH_PATH.write_text(current_hash)
        logger.info(f"Создан файл хэша: {HASH_PATH.name}")
        return

    stored_hash = HASH_PATH.read_text().strip()

    if current_hash != stored_hash:
        logger.bind(user="Илюха!!!").error(
            "Файл .env был изменён! Хэш не совпадает.\n Попался!!!!")
        raise ImproperlyConfigured(
            "Файл .env был изменён! Хэш не совпадает. Попался!!!\n"
        )


if __name__ == '__main__':
    print(ENV_PATH)
    check_env_integrity()
