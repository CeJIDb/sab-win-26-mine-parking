# Python и скрипт разбиения изображений

Сообщение **«This environment is externally managed»** появляется, когда система запрещает ставить пакеты в системный Python (PEP 668). Решение — виртуальное окружение в проекте.

## Шаг 1. Установить поддержку venv (один раз)

В WSL или Linux выполните:

```bash
sudo apt update
sudo apt install python3.12-venv
```

## Шаг 2. Создать виртуальное окружение и установить Pillow

Из корня проекта:

```bash
cd "/home/cejidb/projects/SAB WIN'26"
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install Pillow
```

## Шаг 3. Запускать скрипт разбиения через venv

```bash
cd docs/artifacts
../.venv/bin/python split_image.py "Контекстная диаграмма.jpg"
```

Если файл изображения лежит не в `docs/artifacts`, укажите полный путь вторым аргументом:

```bash
../.venv/bin/python split_image.py "Контекстная диаграмма.jpg" "/путь/к/Контекстная диаграмма.jpg"
```

Тайлы появятся в `docs/artifacts/контекстная_диаграмма_tiles/`.

---

**Альтернатива без venv:** установить только Pillow системно через apt (если пакет есть):  
`sudo apt install python3-pil`
