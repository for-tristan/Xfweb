#!/usr/bin/env python3
"""
Generate a 1200x630 Open Graph banner image for XFoundry link previews.

This is the standard OG image size — used by WhatsApp, Discord, Slack,
Twitter/X, LinkedIn, Facebook, iMessage, etc. when displaying link
previews. Without an og:image meta tag, those platforms show no
preview banner, which makes the link look "fishy" (per user feedback).

Output: public/og.png
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

# ---- Constants ----
WIDTH, HEIGHT = 1200, 630
OUTPUT_PATH = "/home/z/my-project/Xfweb/public/og.png"
LOGO_PATH = "/home/z/my-project/Xfweb/public/logo.png"

# Brand colors (from crimson theme — the default)
BG_COLOR = (7, 7, 7)            # --black: #070707
ACCENT = (220, 20, 60)          # --accent: #dc143c
ACCENT_DARK = (139, 0, 0)       # --accent-dark: #8b0000
TEXT_LIGHT = (239, 239, 239)    # --text-light: #efefef
TEXT_DIM = (153, 153, 153)      # --text-dim: #999

# Fonts — try multiple options; fall back gracefully
FONT_CANDIDATES_HEADING = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]
FONT_CANDIDATES_BODY = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
]


def load_font(candidates, size):
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_radial_glow(img, cx, cy, radius, color, max_alpha=80):
    """Draw a soft radial glow centered at (cx, cy)."""
    # Create a separate layer for the glow
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)

    # Draw concentric circles with decreasing alpha
    steps = 30
    for i in range(steps):
        r = int(radius * (1 - i / steps))
        if r <= 0:
            break
        alpha = int(max_alpha * (1 - i / steps) ** 2)
        glow_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(color[0], color[1], color[2], alpha),
        )

    # Blur for smoothness
    glow = glow.filter(ImageFilter.GaussianBlur(radius=40))
    img.alpha_composite(glow)


def draw_accent_bar(draw, y, height, color):
    """Draw a horizontal accent gradient bar across the full width."""
    for x in range(WIDTH):
        # Gradient: transparent → accent → transparent
        t = x / WIDTH
        # Smooth bell curve
        intensity = math.sin(t * math.pi) ** 1.5
        alpha = int(255 * intensity)
        draw.line([(x, y), (x, y + height)], fill=(color[0], color[1], color[2], alpha))


def main():
    # Start with RGBA for compositing, convert to RGB at the end
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR + (255,))
    draw = ImageDraw.Draw(img)

    # ---- Layer 1: Radial glow behind the logo/title area ----
    draw_radial_glow(img, WIDTH // 2, HEIGHT // 2, 500, ACCENT, max_alpha=55)

    # ---- Layer 2: Subtle dotted texture (optional, adds depth) ----
    # Skip — keep it clean and minimal

    # ---- Layer 3: Top accent gradient bar ----
    # Draw on a separate layer because we need alpha
    bar_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bar_draw = ImageDraw.Draw(bar_layer)
    bar_height = 4
    bar_y = 0
    for x in range(WIDTH):
        t = x / WIDTH
        intensity = math.sin(t * math.pi) ** 1.5
        alpha = int(255 * intensity)
        bar_draw.line([(x, bar_y), (x, bar_y + bar_height)], fill=(ACCENT[0], ACCENT[1], ACCENT[2], alpha))
    img.alpha_composite(bar_layer)

    # ---- Layer 4: Bottom accent gradient bar ----
    bar_layer_bottom = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bar_draw_bottom = ImageDraw.Draw(bar_layer_bottom)
    bar_y_bottom = HEIGHT - bar_height
    for x in range(WIDTH):
        t = x / WIDTH
        intensity = math.sin(t * math.pi) ** 1.5
        alpha = int(255 * intensity)
        bar_draw_bottom.line([(x, bar_y_bottom), (x, bar_y_bottom + bar_height)], fill=(ACCENT[0], ACCENT[1], ACCENT[2], alpha))
    img.alpha_composite(bar_layer_bottom)

    # ---- Layer 5: Logo (centered, above title) ----
    logo_size = 110
    logo_y = 90
    if os.path.exists(LOGO_PATH):
        try:
            logo = Image.open(LOGO_PATH).convert("RGBA")
            # Resize to logo_size x logo_size (preserve aspect)
            logo.thumbnail((logo_size, logo_size), Image.LANCZOS)
            # Center horizontally
            logo_x = (WIDTH - logo.width) // 2
            img.alpha_composite(logo, (logo_x, logo_y))
        except Exception as e:
            print(f"Warning: could not load logo: {e}")

    # ---- Layer 6: Title "XFoundry" ----
    title_font = load_font(FONT_CANDIDATES_HEADING, 96)
    title_text = "XFoundry"
    # Measure text using textbbox (Pillow >= 8.0)
    bbox = draw.textbbox((0, 0), title_text, font=title_font)
    title_w = bbox[2] - bbox[0]
    title_h = bbox[3] - bbox[1]
    title_x = (WIDTH - title_w) // 2
    title_y = logo_y + logo_size + 30
    draw.text((title_x, title_y), title_text, font=title_font, fill=TEXT_LIGHT + (255,))

    # ---- Layer 7: Tagline ----
    tagline_font = load_font(FONT_CANDIDATES_BODY, 32)
    tagline = "The best way to predict the future is to create it."
    bbox2 = draw.textbbox((0, 0), tagline, font=tagline_font)
    tagline_w = bbox2[2] - bbox2[0]
    tagline_x = (WIDTH - tagline_w) // 2
    tagline_y = title_y + title_h + 25
    draw.text((tagline_x, tagline_y), tagline, font=tagline_font, fill=TEXT_DIM + (255,))

    # ---- Layer 8: Domain pill at bottom ----
    domain_font = load_font(FONT_CANDIDATES_BODY, 22)
    domain_text = "xfoundryy.vercel.app"
    bbox3 = draw.textbbox((0, 0), domain_text, font=domain_font)
    domain_w = bbox3[2] - bbox3[0]
    domain_h = bbox3[3] - bbox3[1]
    pill_padding_x = 24
    pill_padding_y = 10
    pill_w = domain_w + pill_padding_x * 2
    pill_h = domain_h + pill_padding_y * 2
    pill_x = (WIDTH - pill_w) // 2
    pill_y = HEIGHT - 90

    # Draw rounded rectangle pill
    pill_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    pill_draw = ImageDraw.Draw(pill_layer)
    pill_draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=pill_h // 2,
        fill=(ACCENT[0], ACCENT[1], ACCENT[2], 30),
        outline=(ACCENT[0], ACCENT[1], ACCENT[2], 120),
        width=1,
    )
    img.alpha_composite(pill_layer)

    # Re-fetch draw after compositing layers
    draw = ImageDraw.Draw(img)
    draw.text(
        (pill_x + pill_padding_x, pill_y + pill_padding_y - 2),
        domain_text,
        font=domain_font,
        fill=TEXT_LIGHT + (255,),
    )

    # ---- Final: convert to RGB and save ----
    final = img.convert("RGB")
    final.save(OUTPUT_PATH, "PNG", optimize=True)
    print(f"Generated: {OUTPUT_PATH}")
    print(f"Size: {WIDTH}x{HEIGHT}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH)} bytes")


if __name__ == "__main__":
    main()
