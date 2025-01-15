## Обновить pip

`python -m pip install --upgrade pip`

## Создание своего колеса из архива tar.gz или папки с файлом setup.py

1. Всё, что нужно – свежая версия setuptools и библиотека wheel
2. `python -m pip install setuptools`
3. `python -m pip install wheel`
2. `python setup.py bdist_wheel`

## Получить в файл название всех установленных пакетов

`python -m pip freeze >requirements.txt`

## Скачать whl файлы согласно списка рекомендаций для оффлайн установки

1. `python -m pip wheel -r requirements.txt -w dist`
2. `python -m pip download -r requirements.txt --dest dist --only-binary :all:`
3. `python -m pip download -r .\requirements.txt`

## Установка whl пакетов

`python -m pip install --no-index --find-links dist -r .\requirements.txt`

[репка с образами](https://disk.yandex.ru/d/mwNyjrgPqyo8oA)<br>
[grafana](https://disk.yandex.ru/d/FeRgvtyFiNpXFw)
[образцы верстки](https://disk.yandex.ru/d/skEKMmowHtxEMg
https://disk.yandex.ru/d/YBTowH1VvyaiDA) 

