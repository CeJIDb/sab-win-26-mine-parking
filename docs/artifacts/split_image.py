# Split large artifact images into tiles for reading in Cursor.
# Usage: python split_image.py [image_name] [path_to_image]
#   image_name: "Impact Map.jpg" | "Opportunity Canvas.jpg" | "User Story Map.jpg" | "Карта навигации.jpg" | "Контекстная диаграмма.jpg"
#   If omitted, defaults to "Opportunity Canvas.jpg"
#   path_to_image: optional; if given, use this path instead of docs/artifacts/<image_name>
# Run from folder docs/artifacts (or pass full path as second arg). Requires: pip install Pillow
#
# After running, tiles appear in <name>_tiles/ (e.g. opportunity_canvas_tiles).
# Open tiles in Cursor and ask to merge content into the corresponding .md file.

import os
import re
import sys

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

try:
    resample = Image.Resampling.LANCZOS
except AttributeError:
    resample = Image.LANCZOS

# Map: filename (as given or full) -> (actual filename, output folder name)
ARTIFACTS = {
    "impact map": ("Impact Map.jpg", "impact_map_tiles"),
    "impact map.jpg": ("Impact Map.jpg", "impact_map_tiles"),
    "opportunity canvas": ("Opportunity Canvas.jpg", "opportunity_canvas_tiles"),
    "opportunity canvas.jpg": ("Opportunity Canvas.jpg", "opportunity_canvas_tiles"),
    "user story map": ("User Story Map.jpg", "user_story_map_tiles"),
    "user story map.jpg": ("User Story Map.jpg", "user_story_map_tiles"),
    "карта навигации": ("Карта навигации.jpg", "карта_навигации_tiles"),
    "карта навигации.jpg": ("Карта навигации.jpg", "карта_навигации_tiles"),
    "контекстная диаграмма": ("Контекстная диаграмма.jpg", "контекстная_диаграмма_tiles"),
    "контекстная диаграмма.jpg": ("Контекстная диаграмма.jpg", "контекстная_диаграмма_tiles"),
}

base = os.path.dirname(os.path.abspath(__file__))

def main():
    raw = (sys.argv[1] if len(sys.argv) > 1 else "Opportunity Canvas.jpg").strip()
    key = raw.lower()
    if key not in ARTIFACTS:
        # Allow exact filename
        if os.path.isfile(os.path.join(base, raw)):
            out_name = re.sub(r"[^\w]+", "_", os.path.splitext(raw)[0]).strip("_").lower() + "_tiles"
            filename, out_dir_name = raw, out_name
        else:
            print("Usage: python split_image.py [image_name]")
            print("  image_name: Impact Map.jpg | Opportunity Canvas.jpg | User Story Map.jpg | Карта навигации.jpg | Контекстная диаграмма.jpg")
            print("  Or run without args for Opportunity Canvas.jpg")
            sys.exit(1)
    else:
        filename, out_dir_name = ARTIFACTS[key]

    if len(sys.argv) > 2 and os.path.isfile(sys.argv[2]):
        path = os.path.abspath(sys.argv[2])
    else:
        path = os.path.join(base, filename)
    if not os.path.isfile(path):
        print("Error: file not found:", path)
        print("Place the image in docs/artifacts or run: python split_image.py \"Контекстная диаграмма.jpg\" /path/to/Контекстная диаграмма.jpg")
        sys.exit(1)

    try:
        img = Image.open(path)
    except Exception as e:
        print("Error opening image:", e)
        sys.exit(1)

    if img.mode not in ("RGB", "RGBA", "L"):
        img = img.convert("RGB")

    w, h = img.size
    print("Image:", filename, "Size:", w, "x", h)

    cols, rows = 4, 4
    tw, th = w // cols, h // rows
    # Выше значение — чётче текст; масштабируем только если тайл очень большой
    max_side = 3200
    out_dir = os.path.join(base, out_dir_name)
    os.makedirs(out_dir, exist_ok=True)

    for r in range(rows):
        for c in range(cols):
            left = c * tw
            top = r * th
            right = w if c == cols - 1 else left + tw
            bottom = h if r == rows - 1 else top + th
            box = (left, top, right, bottom)
            tile = img.crop(box)
            # Уменьшаем только при необходимости, чтобы не размывать текст
            if max(tile.size) > max_side:
                tile.thumbnail((max_side, max_side), resample)
            tile_path = os.path.join(out_dir, "tile_r%d_c%d.png" % (r, c))
            tile.save(tile_path, optimize=False)
            print("Saved", tile_path)

    print("Done. Tiles in:", out_dir)
    print("To build .md: open these tiles in Cursor and ask to fill the corresponding .md from the image content.")

if __name__ == "__main__":
    main()
