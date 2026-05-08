#!/usr/bin/env python3
"""
Generate the Chrome Web Store small promotional tile (440x280).

Design: dark background, large green check mark, brand text 'SanityTV'
+ tagline 'A clean YouTube'.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "store-assets" / "promo-440x280.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 440, 280
BG = (15, 17, 21, 255)
ACCENT = (74, 222, 128, 255)
WHITE = (240, 240, 240, 255)
MUTED = (180, 184, 194, 255)


def find_font(candidates, size):
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


img = Image.new("RGBA", (W, H), BG)
draw = ImageDraw.Draw(img)

# Subtle rounded corners by drawing on full background — Chrome will
# crop circular if needed. We keep it as a flat rectangle.

# Check mark in the left third.
check_box_x, check_box_y, check_box_size = 30, 80, 120
pts = [
    (check_box_x + check_box_size * 0.18, check_box_y + check_box_size * 0.55),
    (check_box_x + check_box_size * 0.42, check_box_y + check_box_size * 0.78),
    (check_box_x + check_box_size * 0.84, check_box_y + check_box_size * 0.28),
]
draw.line(pts, fill=ACCENT, width=14, joint="curve")

# Brand text + tagline on the right.
font_brand = find_font(
    [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ],
    44,
)
font_tag = find_font(
    [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/Library/Fonts/Arial.ttf",
    ],
    20,
)

draw.text((180, 90), "SanityTV", fill=WHITE, font=font_brand)
draw.text((180, 145), "A clean YouTube.", fill=MUTED, font=font_tag)
draw.text((180, 175), "Local. Private. Free.", fill=MUTED, font=font_tag)

img.save(OUT)
print(f"wrote {OUT.relative_to(ROOT)}")
