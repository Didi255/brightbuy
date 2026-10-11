# -*- coding: utf-8 -*-
"""
extract-icons.py - slice the nine category icons out of the grid mockup.
                                                              OWNER: M4
Usage:  python extract-icons.py
Writes: client/public/category-icons/<slug>.png   (nine, transparent)

The idea that makes this reliable: the icon is exactly the set of HOLES
in the tile's light background.

  * seed a flood at the tile's TOP-RIGHT, which is always background
    (the stray amber ring sits top-LEFT), and let it spread through the
    light pixels. That region is the background and nothing else;
  * fill its holes to recover the full rounded rectangle;
  * icon = rectangle MINUS background.

Interior white survives automatically - the sneaker sole, the football,
the monitor UI - because it is never connected to the tile edge. A plain
"light pixels become transparent" threshold punches holes through all of
them. The rounded corners come out right for free, because the dark card
outside them was never inside the rectangle.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = r"D:\dihi aca\sem3\CS3043 Database Systems\project\brightbuy"
SRC = os.path.join(ROOT, "client", "public", "placeholders.jpeg")
OUT = os.path.join(ROOT, "client", "public", "category-icons")

NAMES = ["Laptops", "Monitors", "Computer Accessories",
         "Phones", "Audio", "Kitchen",
         "Cleaning", "Footwear", "Sports & Outdoors"]
SLUG = {"Laptops": "laptops", "Monitors": "monitors",
        "Computer Accessories": "computer-accessories", "Phones": "phones",
        "Audio": "audio", "Kitchen": "kitchen", "Cleaning": "cleaning",
        "Footwear": "footwear", "Sports & Outdoors": "sports-outdoors"}

BG = np.array([241, 240, 236], dtype=np.float32)   # measured off the sheet
T = 20            # colour distance at or below which a pixel IS background
RAMP = 28         # alpha ramps 0->1 over this, continuous at T: no hard cut
CORNER = 0.22     # top-left fraction of a tile that holds the amber ring
EXPORT_W = 512


def L(arr):
    """A WRITABLE L image.

    ImageDraw.floodfill silently does nothing on an image made by
    Image.fromarray - that image shares a read-only buffer with numpy,
    the pixel write fails without raising, and you get back exactly what
    you put in. frombytes allocates its own buffer, so the fill lands.
    """
    h, w = arr.shape
    return Image.frombytes("L", (w, h), np.ascontiguousarray(arr).tobytes())


def bands(v, thr, minrun=20):
    out, s = [], None
    for i, x in enumerate(v):
        if x > thr and s is None:
            s = i
        elif x <= thr and s is not None:
            if i - s > minrun:
                out.append((s, i))
            s = None
    if s is not None and len(v) - s > minrun:
        out.append((s, len(v)))
    return out


def flood_from_border(mask):
    """Everything in `mask` reachable from the edge of the array."""
    img = L(np.where(mask, 255, 0).astype(np.uint8))
    h, w = mask.shape
    for x in range(w):
        for y in (0, h - 1):
            if np.asarray(img)[y, x] == 255:
                ImageDraw.floodfill(img, (x, y), 128, thresh=0)
    for y in range(h):
        for x in (0, w - 1):
            if np.asarray(img)[y, x] == 255:
                ImageDraw.floodfill(img, (x, y), 128, thresh=0)
    return np.asarray(img) == 128


def main():
    rgb = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
    dist = np.sqrt(((rgb - BG) ** 2).sum(axis=2))
    light = dist <= T

    rows = bands(light.sum(axis=1), light.sum(axis=1).max() * 0.25)
    cols = bands(light.sum(axis=0), light.sum(axis=0).max() * 0.25)
    print("grid: %d rows x %d cols" % (len(rows), len(cols)))
    if len(rows) != 3 or len(cols) != 3:
        print("not a 3x3 sheet - aborting rather than guessing")
        return 1

    os.makedirs(OUT, exist_ok=True)
    cells = [(c0, r0, c1, r1) for (r0, r1) in rows for (c0, c1) in cols]

    for name, (x0, y0, x1, y1) in zip(NAMES, cells):
        pad = 12
        X0, Y0 = max(0, x0 - pad), max(0, y0 - pad)
        X1, Y1 = min(rgb.shape[1], x1 + pad), min(rgb.shape[0], y1 + pad)
        sub_light = light[Y0:Y1, X0:X1]
        sub_dist = dist[Y0:Y1, X0:X1]
        sub_rgb = rgb[Y0:Y1, X0:X1].copy()
        h, w = sub_light.shape

        # seed top-right: always tile background, the ring is top-left
        seed = None
        for dy in range(10, h // 3):
            for dx in range(10, w // 3):
                if sub_light[dy, w - 1 - dx]:
                    seed = (w - 1 - dx, dy)
                    break
            if seed:
                break
        if seed is None:
            print("  %-22s no background seed - skipped" % name)
            continue

        img = L(np.where(sub_light, 255, 0).astype(np.uint8))
        ImageDraw.floodfill(img, seed, 128, thresh=0)
        bg_region = np.asarray(img) == 128

        rect = bg_region | ~flood_from_border(~bg_region)   # fill the holes
        icon = rect & ~bg_region

        # drop any blob living wholly in the tile's top-left corner: that
        # is the render artifact, and no icon reaches into that corner
        cy, cx = int(h * CORNER), int(w * CORNER)
        probe = L(np.where(icon, 255, 0).astype(np.uint8))
        while True:
            hits = np.argwhere(np.asarray(probe) == 255)
            if not len(hits):
                break
            py, px = int(hits[0][0]), int(hits[0][1])
            ImageDraw.floodfill(probe, (px, py), 77, thresh=0)
            blob = np.asarray(probe) == 77
            ys, xs = np.where(blob)
            if ys.max() < cy and xs.max() < cx:
                icon = icon & ~blob
            probe = L(np.where(np.asarray(probe) == 77, 0,
                                np.asarray(probe)).astype(np.uint8))

        if not icon.any():
            print("  %-22s EMPTY - skipped" % name)
            continue

        alpha = np.clip((sub_dist - T) / float(RAMP), 0.0, 1.0) * icon
        a3 = np.repeat(alpha[:, :, None], 3, axis=2)
        with np.errstate(divide="ignore", invalid="ignore"):
            true = (sub_rgb - (1 - a3) * BG) / np.where(a3 == 0, 1, a3)
        col = np.where(a3 > 0, np.clip(true, 0, 255), sub_rgb)

        im = Image.fromarray(np.dstack([col, alpha * 255]).astype(np.uint8), "RGBA")
        im = im.crop(im.getbbox())
        r = EXPORT_W / float(im.size[0])
        im = im.resize((EXPORT_W, max(1, int(im.size[1] * r))), Image.LANCZOS)
        path = os.path.join(OUT, SLUG[name] + ".png")
        im.quantize(colors=255, method=Image.FASTOCTREE).save(path, "PNG", optimize=True)
        print("  %-22s %4dx%-4d %5.0f KB  %s"
              % (name, im.size[0], im.size[1],
                 os.path.getsize(path) / 1024.0, SLUG[name] + ".png"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
