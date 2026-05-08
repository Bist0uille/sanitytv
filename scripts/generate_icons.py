#!/usr/bin/env python3
"""
Generate the SanityTV extension icons.

Design rationale: a dark rounded square (matching the popup background
#0f1115) with a green check-style mark in the center. Communicates
"approved / clean" — aligned with the product's stance of keeping good
content while filtering junk.

Output: public/icons/icon-{16,32,48,128}.png
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "icons"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BG = (15, 17, 21, 255)         # #0f1115
ACCENT = (74, 222, 128, 255)   # #4ade80 (tailwind green-400)
SIZES = [16, 32, 48, 128]


def render(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = max(2, size // 6)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)

    # Checkmark geometry as fractions of the canvas, then scaled.
    pts = [
        (0.20, 0.55),  # left start
        (0.42, 0.74),  # bottom of the V
        (0.80, 0.30),  # top-right tip
    ]
    pixel_pts = [(int(x * size), int(y * size)) for x, y in pts]
    width = max(2, size // 8)
    draw.line(pixel_pts, fill=ACCENT, width=width, joint="curve")

    return img


for size in SIZES:
    img = render(size)
    out = OUT_DIR / f"icon-{size}.png"
    img.save(out)
    print(f"  wrote {out.relative_to(ROOT)}")

print("done.")
