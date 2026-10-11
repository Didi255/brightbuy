# -*- coding: utf-8 -*-
"""
tint-product-bg.py - make product photos sit flush in the #F4F1EC tile.
                                                              OWNER: M4
Usage:  python database/tools/tint-product-bg.py [--apply]
        (no flag = dry run, lists what it would touch and changes nothing)

THE PROBLEM
Most product photos are opaque JPEGs shot on white. Dropped into the
tile, each one shows as a white rectangle inside a warm #F4F1EC square -
which reads as a second, nested tile and makes every product look small
and inset.

WHY REPAINT AND NOT CUT OUT
A transparent PNG is the "correct" fix, but it renames every file from
.jpg to .png, and those names are written into the seed data - so it
would mean editing 02_catalogue.js and re-seeding. It also inflates a
photo several times over, PNG being lossless. The tile is a FLAT, FIXED
colour, so painting the background to that exact colour is visually
identical and costs none of that.

Trade-off, stated plainly: the tile colour is now baked into these
files. If TILE ever changes, re-run this from the originals in
database/scratch/sources/.

HOW THE BACKGROUND IS FOUND
Flood-filled inward from the border, never by a global threshold -
these products contain white themselves (sneaker soles, earbuds, shirts)
and a threshold would punch holes straight through them. Only white that
is CONNECTED to the edge is background.

Generated mockups are skipped: their background is a different grey, and
they have the product name rendered into the artwork, so they need
replacing rather than tinting.
"""
import glob
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
IMG_DIR = os.path.join(ROOT, "client", "public", "product-images")
BACKUP = os.path.join(ROOT, "database", "scratch", "sources", "product-images-before-tint")

TILE = (244, 241, 236)      # #F4F1EC, the tile token
WHITE_CUTOFF = 238          # at or above this in every channel = "white"
FEATHER = 1.0               # px of blur on the mask, to kill jagged edges


def writable(arr):
    """A PIL image floodfill can actually write to.

    ImageDraw.floodfill silently does nothing on an Image.fromarray()
    image: that one shares a read-only buffer with numpy, the pixel
    write fails without raising, and you get back what you put in.
    """
    h, w = arr.shape
    return Image.frombytes("L", (w, h), np.ascontiguousarray(arr).tobytes())


def is_mockup(im):
    """The generated placeholders: 600x400 with a dark text band."""
    w, h = im.size
    if (w, h) != (600, 400):
        return False
    band = np.asarray(im.convert("RGB")).astype(int)[int(h * 0.80):, :]
    return (band.min(axis=2) < 120).mean() > 0.01


def background_mask(rgb):
    """True where the pixel is white AND reachable from the border."""
    near = (rgb.min(axis=2) >= WHITE_CUTOFF)
    img = writable(np.where(near, 255, 0).astype(np.uint8))
    h, w = near.shape
    seeds = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)]
    seeds += [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for sx, sy in seeds:
        if np.asarray(img)[sy, sx] == 255:
            ImageDraw.floodfill(img, (sx, sy), 128, thresh=0)
    return np.asarray(img) == 128


def main():
    apply = "--apply" in sys.argv
    files = sorted(f for f in glob.glob(os.path.join(IMG_DIR, "*"))
                   if not f.lower().endswith(".avif"))
    if apply:
        os.makedirs(BACKUP, exist_ok=True)

    done = skipped = 0
    for path in files:
        name = os.path.basename(path)
        try:
            im = Image.open(path)
        except Exception as exc:
            print("  %-44s unreadable (%s)" % (name, exc))
            continue

        if is_mockup(im):
            print("  %-44s skip - generated mockup, replace it instead" % name)
            skipped += 1
            continue

        rgb = np.asarray(im.convert("RGB")).astype(np.float32)
        mask = background_mask(rgb)
        share = mask.mean()
        if share < 0.05:
            print("  %-44s skip - no white border (%.0f%%)" % (name, share * 100))
            skipped += 1
            continue

        if not apply:
            print("  %-44s would tint %.0f%% of pixels" % (name, share * 100))
            done += 1
            continue

        shutil.copy2(path, os.path.join(BACKUP, name))

        # soften the mask so the join is not a hard jagged line
        soft = np.asarray(
            Image.fromarray((mask * 255).astype(np.uint8))
                 .filter(ImageFilter.GaussianBlur(FEATHER))
        ).astype(np.float32) / 255.0
        a = soft[:, :, None]
        out = rgb * (1 - a) + np.array(TILE, dtype=np.float32) * a

        Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB").save(
            path, quality=92, subsampling=0)
        print("  %-44s tinted %.0f%%" % (name, share * 100))
        done += 1

    print()
    print("%s: %d image(s) %s, %d skipped"
          % ("APPLIED" if apply else "DRY RUN", done,
             "tinted" if apply else "would be tinted", skipped))
    if not apply:
        print("re-run with --apply to write. Originals are copied to")
        print("  database/scratch/sources/product-images-before-tint/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
