# -*- coding: utf-8 -*-
"""
make-og-image.py — build the 1200x630 link-preview card.   OWNER: M4

Usage:  python database/tools/make-og-image.py
Writes: client/public/og-image.png

WHY THIS EXISTS
WhatsApp, Slack, Discord and every social crawler read `og:image`. With no
such tag they fall back to the favicon, which renders as a tiny square in
the corner of the card and looks unfinished. A real 1200x630 image is the
difference between a link that looks like a product and one that looks
like a localhost demo.

1200x630 is the size every platform crops to (1.91:1). Anything important
is kept away from the edges, because some clients crop to a square.

The card is deliberately the hero, reused: same background, same amber
glow, same product cluster. A share card that looks like a different
product is worse than none.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PUBLIC = os.path.join(ROOT, "client", "public")
OUT = os.path.join(PUBLIC, "og-image.png")

W, H = 1200, 630
INK_9 = (18, 17, 16)        # page background
INK_0 = (245, 240, 232)     # primary text
INK_2 = (168, 159, 147)     # secondary text
AMBER = (255, 140, 0)

HEADLINE = "BrightBuy"
TAGLINE = "Laptops, phones, audio, gaming and toys"
LINE2 = "Five days to any main city in Texas"
FOOT = "21 Texas cities  ·  cash on delivery"


def font(names, size):
    """First font that exists, at the requested size."""
    for n in names:
        p = os.path.join(r"C:\Windows\Fonts", n)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


BOLD = ["Inter-Bold.ttf", "seguibl.ttf", "segoeuib.ttf", "arialbd.ttf"]
BODY = ["Inter-Regular.ttf", "segoeui.ttf", "arial.ttf"]


def main():
    card = Image.new("RGB", (W, H), INK_9)

    # the warm glow behind the artwork, same as the hero's
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [W * 0.42, -H * 0.35, W * 1.35, H * 1.35], fill=AMBER + (54,))
    card = Image.alpha_composite(
        card.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(150)))

    # the product cluster, bleeding off the right edge exactly as on the page
    cluster_path = os.path.join(PUBLIC, "hero-cluster.png")
    if os.path.exists(cluster_path):
        art = Image.open(cluster_path).convert("RGBA")
        target_w = int(W * 0.62)
        art = art.resize(
            (target_w, int(target_w * art.size[1] / art.size[0])), Image.LANCZOS)
        card.alpha_composite(art, (W - target_w + 40, H - art.size[1] - 10))

    # a scrim so the type on the left always has contrast, whatever the
    # artwork happens to be doing behind it
    scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sp = scrim.load()
    for x in range(W):
        t = x / float(W)
        a = 255 if t <= 0.30 else max(0, int(255 * (1 - (t - 0.30) / 0.45)))
        for y in range(H):
            sp[x, y] = INK_9 + (a,)
    card = Image.alpha_composite(card, scrim)

    d = ImageDraw.Draw(card)
    x = 72

    # a short amber rule: the one accent, used once
    d.rounded_rectangle([x, 150, x + 64, 156], 3, fill=AMBER)

    d.text((x, 190), HEADLINE, font=font(BOLD, 86), fill=INK_0)
    d.text((x, 306), TAGLINE, font=font(BODY, 30), fill=INK_2)
    d.text((x, 348), LINE2, font=font(BODY, 30), fill=INK_2)
    d.text((x, 436), FOOT, font=font(BODY, 21), fill=(122, 114, 103))

    card.convert("RGB").save(OUT, "PNG", optimize=True)
    kb = os.path.getsize(OUT) / 1024.0
    print("wrote %s  %dx%d  %.0f KB" % (os.path.relpath(OUT, ROOT), W, H, kb))
    if kb > 300:
        print("note: over 300 KB — some crawlers skip large images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
