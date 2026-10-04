#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
أداة مراجعة بصرية: تجمع صورًا متعددة في لوحة واحدة مع تسمية لكل صورة.

تُستخدم لـ:
  - مراجعة البوسترات التصميمية المولّدة قبل اعتمادها.
  - مقارنة صورة بوستر downloaded مع اسم العمل المتوقع (خطوة التحقق من الصحة).

الاستخدام:
  python3 tools/poster-hunt/montage.py --out /home/user/scratch/sheet-1.png --cols 4 \
      --label "public/posters/x.jpg=Expected Title (2024)" ...
أو مع ملف قائمة (كل سطر: <path>\t<label>):
  python3 tools/poster-hunt/montage.py --out sheet.png --list list.tsv --cols 4 --rows 4
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFont

CELL_W, CELL_H = 300, 420
FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts")


def font(size, bold=False):
    name = "IBMPlexSansArabic-Bold.ttf" if bold else "IBMPlexSansArabic-Regular.ttf"
    path = os.path.join(FONT_DIR, name)
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def collect(args):
    items = []
    if args.list:
        with open(args.list, encoding="utf-8") as fh:
            for line in fh:
                line = line.rstrip("\n")
                if not line:
                    continue
                path, _, label = line.partition("\t")
                items.append((path, label or os.path.basename(path)))
    for spec in args.label or []:
        path, _, label = spec.partition("=")
        items.append((path, label or os.path.basename(path)))
    items.extend((p, os.path.basename(p)) for p in args.images or [])
    return [(p, l) for p, l in items if os.path.exists(p)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--rows", type=int, default=0, help="صفوف اللوحة (0 = تلقائي)")
    ap.add_argument("--label", action="append", help="path=Tiny label")
    ap.add_argument("--list", help="TSV file: path<TAB>label")
    ap.add_argument("images", nargs="*")
    args = ap.parse_args()

    items = collect(args)
    if not items:
        print("لا صور مطابقة", file=sys.stderr)
        return 1

    cols = max(1, args.cols)
    rows = args.rows or max(1, -(-len(items) // cols))
    pad, label_h = 10, 46
    sheet_w = cols * (CELL_W + pad) + pad
    sheet_h = rows * (CELL_H + label_h + pad) + pad
    sheet = Image.new("RGB", (sheet_w, sheet_h), (14, 16, 20))
    d = ImageDraw.Draw(sheet)
    f_small, f_lbl = font(15), font(17, bold=True)

    for i, (path, label) in enumerate(items[: cols * rows]):
        try:
            img = Image.open(path).convert("RGB")
        except OSError as exc:
            print(f"تعذّر فتح {path}: {exc}", file=sys.stderr)
            continue
        img.thumbnail((CELL_W, CELL_H), Image.LANCZOS)
        col, row = i % cols, i // cols
        x = pad + col * (CELL_W + pad)
        y = pad + row * (CELL_H + label_h + pad)
        sheet.paste(img, (x + (CELL_W - img.width) // 2, y))
        d.rectangle([x, y + CELL_H + 4, x + CELL_W, y + CELL_H + label_h], fill=(24, 27, 34))
        d.text((x + 8, y + CELL_H + 8), label[:46], font=f_lbl, fill=(238, 242, 250))
        d.text((x + 8, y + CELL_H + 28), os.path.basename(path)[:52], font=f_small, fill=(150, 160, 176))

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    sheet.save(args.out, "PNG", optimize=True)
    print(f"✔ {args.out}  ({len(items)} صورة في {rows}×{cols})  {os.path.getsize(args.out)//1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
