# -*- coding: utf-8 -*-
"""
make-hero-cluster.py — turn the white-background cluster render into a
clean transparent PNG for the hero.                          OWNER: M4

Usage:
    python database/tools/make-hero-cluster.py <source-image>

Writes:
    client/public/hero-cluster.png     ~1600px wide, 2x for retina
    client/public/hero-cluster-900.png  900px, served to phones via srcSet

── Why not a plain "white pixels become transparent" threshold ──────
Because the illustration CONTAINS white: the AirPods, the laptop bezel
highlights, the white flecks in the sparkles. A global threshold punches
holes straight through them.

So instead this flood-fills inward from the four corners. Only white that
is CONNECTED to the border is background; white enclosed by the artwork
is left alone. That one decision is the difference between a clean cut
and a hollowed-out pair of earbuds.

── The fringe ───────────────────────────────────────────────────────
Anti-aliased edge pixels are a blend of the object and the white page.
Left alone they show as a pale halo on a #121110 background — the single
thing the brief says will make this look pasted in. So after feathering
the alpha, each partially transparent pixel is un-blended from white:

    original = alpha * true_colour + (1 - alpha) * white
    true_colour = (original - (1 - alpha) * white) / alpha

That recovers the object's real colour and the halo disappears.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "client", "public")

# How close to pure white counts as background. Generous, because the
# render's "white" is not exactly #FFFFFF at the edges.
WHITE_CUTOFF = 236
FEATHER = 0.8          # px of alpha blur; enough to soften, not to smear
TARGET_W = 1600
SMALL_W = 900


def build_alpha(rgb):
    """Alpha mask: 0 where the white is connected to the border."""
    w, h = rgb.size

    # 255 where the pixel is near-white, 0 otherwise
    r, g, b = rgb.split()
    near_white = Image.new("L", (w, h), 0)
    px = near_white.load()
    rp, gp, bp = r.load(), g.load(), b.load()
    for y in range(h):
        for x in range(w):
            if rp[x, y] >= WHITE_CUTOFF and gp[x, y] >= WHITE_CUTOFF and bp[x, y] >= WHITE_CUTOFF:
                px[x, y] = 255

    # Flood from every border pixel that is near-white. Only connected
    # white is background; white inside the artwork survives.
    flood = near_white.copy()
    seeds = []
    for x in range(w):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(h):
        seeds.append((0, y))
        seeds.append((w - 1, y))

    fp = flood.load()
    for sx, sy in seeds:
        if fp[sx, sy] == 255:
            ImageDraw.floodfill(flood, (sx, sy), 128, thresh=0)

    # 128 == background. Everything else is the subject.
    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    fp = flood.load()
    for y in range(h):
        for x in range(w):
            if fp[x, y] == 128:
                ap[x, y] = 0
    return alpha


def unfringe(rgb, alpha):
    """Un-blend each edge pixel from white, so no pale halo survives."""
    out = rgb.copy()
    op = out.load()
    ap = alpha.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            a = ap[x, y]
            if 0 < a < 255:
                f = a / 255.0
                r, g, b = op[x, y]
                op[x, y] = (
                    max(0, min(255, int((r - (1 - f) * 255) / f))),
                    max(0, min(255, int((g - (1 - f) * 255) / f))),
                    max(0, min(255, int((b - (1 - f) * 255) / f))),
                )
    return out


def main():
    if len(sys.argv) < 2:
        print("usage: python database/tools/make-hero-cluster.py <source-image>")
        return 1

    src = sys.argv[1]
    if not os.path.exists(src):
        print("not found: %s" % src)
        return 1

    im = Image.open(src).convert("RGB")
    print("source: %dx%d" % im.size)

    alpha = build_alpha(im)
    alpha = alpha.filter(ImageFilter.GaussianBlur(FEATHER))
    im = unfringe(im, alpha)

    im.putalpha(alpha)

    # trim to the artwork, so the PNG carries no dead transparent margin
    box = im.getbbox()
    if box:
        im = im.crop(box)
        print("trimmed to: %dx%d" % im.size)

    os.makedirs(OUT_DIR, exist_ok=True)

    for width, name in ((TARGET_W, "hero-cluster.png"), (SMALL_W, "hero-cluster-900.png")):
        ratio = width / float(im.size[0])
        resized = im.resize((width, int(im.size[1] * ratio)), Image.LANCZOS)
        path = os.path.join(OUT_DIR, name)

        # optimize=True only re-runs zlib harder; the bytes are in the
        # colour depth. Quantising to a 255-colour palette stores one byte
        # per pixel instead of four. FASTOCTREE is the one PIL quantiser
        # that carries alpha through, which is the whole point here.
        small = resized.quantize(colors=255, method=Image.FASTOCTREE)
        small.save(path, "PNG", optimize=True)

        kb = os.path.getsize(path) / 1024.0
        flag = "" if kb < 400 else "   <-- over the 400KB budget"
        print("wrote %-24s %4dx%-4d  %6.0f KB%s" % (name, resized.size[0], resized.size[1], kb, flag))

    return 0


if __name__ == "__main__":
    sys.exit(main())
