"""
ForgeHabits widget preview generator.
Run on-device with Termux Python + Pillow. No base64, no binary transfer.
"""
from PIL import Image, ImageDraw, ImageFont
import math, os

BG = (8, 8, 8)
ACCENT = (255, 107, 53)      # ember orange
ACCENT_DIM = (90, 45, 25)
TEXT = (240, 240, 240)
SUBTEXT = (150, 150, 150)
CARD = (24, 24, 24)

OUT_DIR = "../assets/images"
SCALE = 3  # dp -> px

def font(size):
    paths = [
        "/system/fonts/Roboto-Bold.ttf",
        "/system/fonts/DroidSans-Bold.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def rounded_bg(w, h, radius=24):
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=BG)
    return img, draw

def draw_progress(path, pct=0.7):
    w, h = 110 * SCALE, 110 * SCALE
    img, draw = rounded_bg(w, h)
    cx, cy = w // 2, h // 2
    r = int(w * 0.32)
    thick = int(w * 0.09)
    bbox = [cx - r, cy - r, cx + r, cy + r]
    draw.arc(bbox, 0, 360, fill=ACCENT_DIM, width=thick)
    start = -90
    end = start + 360 * pct
    draw.arc(bbox, start, end, fill=ACCENT, width=thick)
    f = font(int(w * 0.16))
    txt = f"{int(pct*100)}%"
    tb = draw.textbbox((0, 0), txt, font=f)
    draw.text((cx - (tb[2]-tb[0])/2, cy - (tb[3]-tb[1])/2 - tb[1]), txt, fill=TEXT, font=f)
    img.save(path)

def draw_tasks(path):
    w, h = 180 * SCALE, 180 * SCALE
    img, draw = rounded_bg(w, h)
    pad = int(w * 0.08)
    f_title = font(int(w * 0.09))
    draw.text((pad, pad * 0.7), "Today", fill=TEXT, font=f_title)
    rows = [("Meditate", True), ("Read 20 min", True), ("Workout", False), ("Journal", False)]
    y = pad * 2.4
    row_h = (h - y - pad) / len(rows)
    f_row = font(int(w * 0.07))
    for name, done in rows:
        box = [pad, y + row_h*0.25, pad + row_h*0.5, y + row_h*0.75]
        if done:
            draw.rounded_rectangle(box, radius=6, fill=ACCENT)
        else:
            draw.rounded_rectangle(box, radius=6, outline=SUBTEXT, width=3)
        color = SUBTEXT if done else TEXT
        draw.text((pad + row_h*0.5 + pad*0.5, y + row_h*0.22), name, fill=color, font=f_row)
        y += row_h
    img.save(path)

def draw_combined(path):
    w, h = 250 * SCALE, 180 * SCALE
    img, draw = rounded_bg(w, h)
    # left: mini ring
    cx, cy = int(w * 0.22), h // 2
    r = int(h * 0.28)
    thick = int(h * 0.09)
    bbox = [cx - r, cy - r, cx + r, cy + r]
    draw.arc(bbox, 0, 360, fill=ACCENT_DIM, width=thick)
    draw.arc(bbox, -90, -90 + 360*0.7, fill=ACCENT, width=thick)
    f = font(int(h * 0.16))
    txt = "70%"
    tb = draw.textbbox((0,0), txt, font=f)
    draw.text((cx - (tb[2]-tb[0])/2, cy - (tb[3]-tb[1])/2 - tb[1]), txt, fill=TEXT, font=f)
    # divider
    dx = int(w * 0.42)
    draw.line([dx, h*0.15, dx, h*0.85], fill=(40,40,40), width=2)
    # right: task rows
    pad = int(w * 0.05)
    rows = [("Meditate", True), ("Read", True), ("Workout", False)]
    y = h * 0.2
    row_h = (h * 0.6) / len(rows)
    f_row = font(int(h * 0.11))
    for name, done in rows:
        box = [dx + pad, y + row_h*0.25, dx + pad + row_h*0.4, y + row_h*0.75]
        if done:
            draw.rounded_rectangle(box, radius=5, fill=ACCENT)
        else:
            draw.rounded_rectangle(box, radius=5, outline=SUBTEXT, width=2)
        color = SUBTEXT if done else TEXT
        draw.text((dx + pad + row_h*0.5, y + row_h*0.18), name, fill=color, font=f_row)
        y += row_h
    img.save(path)

def draw_heatmap(path):
    w, h = 250 * SCALE, 110 * SCALE
    img, draw = rounded_bg(w, h)
    pad = int(w * 0.06)
    cols, rows = 20, 5
    cell = min((w - 2*pad) / cols, (h - 2*pad) / rows) * 0.85
    gap = cell * 0.18
    import random
    random.seed(42)
    levels = [ACCENT_DIM, (150,70,35), (200,90,40), ACCENT]
    start_x = pad
    start_y = pad
    for c in range(cols):
        for r in range(rows):
            lvl = random.choice([0,0,1,1,2,3])
            x0 = start_x + c * (cell + gap)
            y0 = start_y + r * (cell + gap)
            draw.rounded_rectangle([x0, y0, x0+cell, y0+cell], radius=cell*0.2, fill=levels[lvl])
    img.save(path)

if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    draw_progress(os.path.join(OUT_DIR, "widget_preview_progress.png"))
    draw_tasks(os.path.join(OUT_DIR, "widget_preview_tasks.png"))
    draw_combined(os.path.join(OUT_DIR, "widget_preview_combined.png"))
    draw_heatmap(os.path.join(OUT_DIR, "widget_preview_heatmap.png"))
    print("Done. Files written to", OUT_DIR)
