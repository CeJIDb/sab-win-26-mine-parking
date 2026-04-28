# ast-index — правила поиска по коду

Опциональное правило. Применяется, если в системе установлен бинарь `ast-index` (например, через homebrew). Если бинаря нет — игнорируй это правило, используй Grep.

Бинарь обычно: `/home/linuxbrew/.linuxbrew/bin/ast-index`.
Индексирует JS/MJS/CJS/TS/Shell/Python — для parking это `scripts/`, `ui/templates/`, `.husky/`.

---

## Обязательные правила поиска (если ast-index доступен)

1. **Сначала ast-index** для любого поиска по коду — он точнее grep по символам.
2. **Не дублировать**: если ast-index вернул результаты — это полный ответ. Не перепроверять Grep.
3. Grep — только если ast-index вернул пустой результат или нужен regex по строковым литералам.

## Обязательные правила чтения

1. **Перед `Read` любого файла длиннее 300 строк — сначала `ast-index outline <file>`**.
2. По outline находи нужный символ или диапазон строк, затем читай через `offset` / `limit`.
3. Никогда не читай большие файлы целиком без outline.

Пример больших файлов в parking:

```bash
ast-index outline scripts/atomic-commit.mjs
# → 20+ функций: classifyFile, BUCKET_DEFS, main …

ast-index outline scripts/validate-plans.mjs
# → структура валидатора планов перед чтением
```

---

## Полезные команды

```bash
# Универсальный поиск
ast-index search "BUCKET"         # символы и файлы, содержащие "BUCKET"
ast-index file "atomic"           # файлы по фрагменту пути/имени

# Символы
ast-index symbol "classifyFile"   # определение символа
ast-index usages "classifyFile"   # все использования
ast-index refs "classifyFile"     # определение + импорты + usages

# Изменения текущей ветки
ast-index changed                 # какие символы изменились

# Качество
ast-index todo                    # все TODO/FIXME/HACK
```

---

## Правила для подагентов

При запуске подагента через Agent tool для работы с кодом — включи в промпт дословно:

```
Use `ast-index` via Bash for code search (NOT grep / the Grep tool):
  ast-index search "query"           — universal search (files + symbols)
  ast-index file "Name"              — find a file by name fragment
  ast-index symbol "Name"            — find a symbol definition
  ast-index usages "Name"            — every usage of a symbol
  ast-index outline <file>           — symbols in a file
  ast-index refs "Name"              — definitions + imports + usages at once
  ast-index changed                  — symbols changed in current branch
Use Grep ONLY if ast-index returned empty.

Before Read-ing any file over 300 lines, run ast-index outline <file> first,
then read only the targeted slice via offset/limit.
```

---

## Когда ast-index возвращает пустой результат

- Индекс устарел → `ast-index update`, повтори запрос.
- Символ за динамическим `require()` или шаблонной строкой → Grep.
- Ищешь строковый литерал, не символ → Grep.
- Не делай `Read` всего файла в поисках символа — используй Grep с паттерном.
