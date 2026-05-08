#!/usr/bin/env python3
"""
Generate the Chrome Web Store small promotional tile (440x280) by
compositing the canonical brand logo with the tagline.

Layout: logo on the left (240x240, padded), tagline on the right
("A clean YouTube." big + "Local. Private. Free." small).
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "store-assets" / "logo.png"
OUT = ROOT / "store-assets" / "promo-440x280.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 440, 280
BG = (0, 0, 0, 255)  # Match the logo's black background.
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

# Logo on the left.
logo = Image.open(SOURCE).convert("RGBA")
LOGO_SIZE = 200
logo_resized = logo.resize((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS)
img.alpha_composite(logo_resized, (10, (H - LOGO_SIZE) // 2))

# Tagline on the right.
draw = ImageDraw.Draw(img)
font_tag_lg = find_font(
    [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ],
    21,
)
font_tag_sm = find_font(
    [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/Library/Fonts/Arial.ttf",
    ],
    14,
)

draw.text((225, 117), "A clean YouTube.", fill=WHITE, font=font_tag_lg)
draw.text((225, 152), "Local. Private. Free.", fill=MUTED, font=font_tag_sm)

img.save(OUT)
print(f"wrote {OUT.relative_to(ROOT)}")
