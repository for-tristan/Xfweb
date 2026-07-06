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
ACCENT = (220, 20, 60)          # --accent: #dc143c
TEXT_LIGHT = (245, 245, 245)    # near-white
TEXT_DIM = (140, 140, 140)      # mid-gray for tagline
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
    # Generous left padding — pushes content off the edge, gives the
    # design breathing room. Linear/Vercel/Stripe all do this.
    pad_left = 110
    pad_top = 110

    # ---- Single accent element: thin vertical line on the left edge ----
    # This is the ONLY color in the image. Everything else is grayscale.
    # 4px wide, 220px tall, positioned at the title's left edge.
    accent_x = pad_left - 28
    accent_y_top = pad_top + 80
    accent_y_bottom = accent_y_top + 240
    draw.rectangle(
        [accent_x, accent_y_top, accent_x + 4, accent_y_bottom],
        fill=ACCENT,
    )

    # ---- Logo: small, top-left, no decorations ----
    logo_size = 38
    if os.path.exists(LOGO_PATH):
        try:
            logo = Image.open(LOGO_PATH).convert("RGBA")
            logo.thumbnail((logo_size, logo_size), Image.LANCZOS)
            img.paste(logo, (pad_left, pad_top), logo)
        except Exception as e:
            print(f"Warning: could not load logo: {e}")

    # ---- Wordmark next to the logo ----
    # Small, restrained — it's not the hero, the title is.
    wordmark_font = load_font(FONT_HEADING, FONT_FALLBACK_BOLD, 22)
    wordmark_text = "XFoundry"
    # Vertically center with the logo
    wordmark_y = pad_top + (logo_size // 2) - 11
    draw.text((pad_left + logo_size + 12, wordmark_y), wordmark_text,
              font=wordmark_font, fill=TEXT_LIGHT)

    # ---- Hero title ----
    # Two lines, big, left-aligned. The "Building" word is the focal point.
    title_font = load_font(FONT_HEADING, FONT_FALLBACK_BOLD, 84)
    title_y = pad_top + 90
    line1 = "Building"
    line2 = "the future."
    draw.text((pad_left, title_y), line1, font=title_font, fill=TEXT_LIGHT)
    # Measure line1 height to position line2 below it
    bbox1 = draw.textbbox((0, 0), line1, font=title_font)
    line1_h = bbox1[3] - bbox1[1]
    line_spacing = 12
    draw.text((pad_left, title_y + line1_h + line_spacing), line2,
              font=title_font, fill=TEXT_LIGHT)

    # ---- Tagline ----
    # Single line, dim, generous space below the title.
    tagline_font = load_font(FONT_BODY, FONT_FALLBACK_REG, 26)
    tagline_text = "The best way to predict the future is to create it."
    bbox2 = draw.textbbox((0, 0), line2, font=title_font)
    line2_h = bbox2[3] - bbox2[1]
    tagline_y = title_y + line1_h + line_spacing + line2_h + 38
    draw.text((pad_left, tagline_y), tagline_text,
              font=tagline_font, fill=TEXT_DIM)

    # ---- URL: bottom-left, very dim ----
    # Most platforms already show the URL in their preview card, but
    # including it in the image itself makes the banner feel complete
    # when viewed standalone (e.g. in Discord's image embed).
    url_font = load_font(FONT_BODY, FONT_FALLBACK_REG, 18)
    url_text = "xfoundryy.vercel.app"
    url_y = HEIGHT - 70
    draw.text((pad_left, url_y), url_text, font=url_font, fill=TEXT_DIMMER)

    # ---- Save ----
    img.save(OUTPUT_PATH, "PNG", optimize=True)
    print(f"Generated: {OUTPUT_PATH}")
    print(f"Size: {WIDTH}x{HEIGHT}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH)} bytes")


if __name__ == "__main__":
    main()
