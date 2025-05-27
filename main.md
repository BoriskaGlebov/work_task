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
4. `pip download -d ./packages --platform win_amd64 --python-version 38 --only-binary=:all: --implementation cp -r requirements.txt`


## Установка whl пакетов

`python -m pip install --no-index --find-links dist -r requirements.txt`


## Скачать docker образ, а потом загрузить для сборки образа на его основе

```bash 
  docker save python:3.12-slim -o .\dist2\python_3.12_slim.tar 
  docker save nginx:alpine -o .\dist2\nginx_alpine.tar 
```

## Сборка из образа 

```bash
    docker load -i .\dist2\python_3.12_slim.tar
    docker load -i .\dist2\nginx_alpine.tar


```


[репка с образами](https://disk.yandex.ru/d/mwNyjrgPqyo8oA)<br>
[grafana](https://disk.yandex.ru/d/FeRgvtyFiNpXFw)

[верстка1](https://disk.yandex.ru/d/YBTowH1VvyaiDA) 
[верстка2](https://disk.yandex.ru/d/skEKMmowHtxEMg) 

[КОнтейнер1](https://disk.yandex.ru/d/1028OIhsfTuImQ)
[КОнтейнер2](https://disk.yandex.ru/d/hCNHgj-Wd_yQUg)

[FRONTEND](https://disk.yandex.ru/d/fryy7S-eUYAtzQ)

