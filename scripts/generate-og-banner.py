#!/usr/bin/env python3
"""
Generate a minimalist 1200x630 Open Graph banner for XFoundry.

Design philosophy: negative space over decoration. One accent line,
one logo, one title, one tagline. Inspired by Linear / Vercel / Stripe
OG images — clean typography, restrained color, generous padding.

Output: public/og.png
"""

from PIL import Image, ImageDraw, ImageFont
import os

# ---- Constants ----
WIDTH, HEIGHT = 1200, 630
OUTPUT_PATH = "/home/z/my-project/Xfweb/public/og.png"
LOGO_PATH = "/home/z/my-project/Xfweb/public/logo.png"

# Brand colors (crimson theme — the default)
BG_COLOR = (7, 7, 7)            # --black: #070707
TEXT_LIGHT = (245, 245, 245)    # near-white
TEXT_DIMMER = (95, 95, 95)      # darker gray for URL

# Carlito = metrically compatible with Calibri. Clean, modern, much
# less generic than DejaVu Sans. Falls back gracefully if missing.
FONT_HEADING = "/usr/share/fonts/truetype/english/Carlito-Bold.ttf"
FONT_BODY = "/usr/share/fonts/truetype/english/Carlito-Regular.ttf"
FONT_FALLBACK_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_FALLBACK_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def load_font(primary, fallback, size):
    for path in (primary, fallback):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def main():
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # ---- Layout ----
    # Centered composition: logo + wordmark in the visual center,
    # domain at bottom-center. Nothing else. Pure brand mark.
    center_x = WIDTH // 2
    center_y = HEIGHT // 2

    # ---- Logo: centered horizontally, vertically positioned so the
    # logo+wordmark block sits at the visual center of the canvas. ----
    logo_size = 96
    logo_img = None
    if os.path.exists(LOGO_PATH):
        try:
            logo_img = Image.open(LOGO_PATH).convert("RGBA")
            logo_img.thumbnail((logo_size, logo_size), Image.LANCZOS)
        except Exception as e:
            print(f"Warning: could not load logo: {e}")

    # ---- Wordmark ----
    wordmark_font = load_font(FONT_HEADING, FONT_FALLBACK_BOLD, 72)
    wordmark_text = "XFoundry"
    bbox_wm = draw.textbbox((0, 0), wordmark_text, font=wordmark_font)
    wordmark_w = bbox_wm[2] - bbox_wm[0]
    wordmark_h = bbox_wm[3] - bbox_wm[1]

    # Vertical stack: logo on top, gap, wordmark below.
    # Center the whole stack vertically.
    gap_between = 28
    total_h = logo_size + gap_between + wordmark_h
    stack_top = center_y - total_h // 2

    logo_y = stack_top
    if logo_img:
        logo_x = center_x - (logo_img.width // 2)
        img.paste(logo_img, (logo_x, logo_y), logo_img)

    wordmark_y = logo_y + logo_size + gap_between - 4  # -4 optical adjust for descender baseline
    wordmark_x = center_x - (wordmark_w // 2)
    draw.text((wordmark_x, wordmark_y), wordmark_text,
              font=wordmark_font, fill=TEXT_LIGHT)

    # ---- URL: bottom-center, very dim ----
    url_font = load_font(FONT_BODY, FONT_FALLBACK_REG, 18)
    url_text = "xfoundryy.vercel.app"
    bbox_url = draw.textbbox((0, 0), url_text, font=url_font)
    url_w = bbox_url[2] - bbox_url[0]
    url_x = center_x - (url_w // 2)
    url_y = HEIGHT - 70
    draw.text((url_x, url_y), url_text, font=url_font, fill=TEXT_DIMMER)

    # ---- Save ----
    img.save(OUTPUT_PATH, "PNG", optimize=True)
    print(f"Generated: {OUTPUT_PATH}")
    print(f"Size: {WIDTH}x{HEIGHT}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH)} bytes")


if __name__ == "__main__":
    main()
