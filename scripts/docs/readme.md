# Docs Tooling Scripts

Helper scripts for preparing project documentation materials.

## Available Scripts

- `extract-docx.py` - converts `.docx` transcripts into `.txt` files (default target: `docs/transcripts/`).
- `split-image.py` - splits large artifact images into tiles under `docs/artifacts/*_tiles/`.

## Usage

```bash
python scripts/docs/extract-docx.py
python scripts/docs/split-image.py "Контекстная диаграмма.jpg"
```
