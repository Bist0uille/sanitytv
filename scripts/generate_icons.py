#!/usr/bin/env python3
"""
Generate the SanityTV extension icons (16/32/48/128 px) from the
canonical brand logo at store-assets/logo.png.

Uses Lanczos resampling for the down-scale and writes RGBA PNGs.
The 16x16 and 32x32 sizes will lose the readable "SANITYTV" text — that
is expected for any toolbar icon at those sizes. The mark (play button +
shield) stays recognizable.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "store-assets" / "logo.png"
OUT_DIR = ROOT / "public" / "icons"
OUT_DIR.mkdir(parents=True, exist_ok=True)

if not SOURCE.exists():
    raise SystemExit(f"missing source logo at {SOURCE}")

logo = Image.open(SOURCE).convert("RGBA")

for size in [16, 32, 48, 128]:
    resized = logo.resize((size, size), Image.LANCZOS)
    out = OUT_DIR / f"icon-{size}.png"
    resized.save(out)
    print(f"  wrote {out.relative_to(ROOT)}")

print("done.")
