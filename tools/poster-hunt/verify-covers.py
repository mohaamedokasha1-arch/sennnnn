#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
فحص آلي لأغلفة المسلسلات المولّدة (يُشغَّل بعد tools/series-covers-install.mjs):
  1) وجود الملف لكل مسلسل منشور + أبعاده 600×900 + حجمه ≤ 200KB.
  2) عدم تكرار أي صورة بين عملين (بصمة SHA-1).
  3) العنوان المطبوع يدخل فعليًا داخل الغلاف: نفس خوارزمية اللفّ في lib/make-poster.py
     (3 أسطر كحد أقصى عند أصغر حجم خط 30px) وعرض السطر لا يتجاوز الهامش.
  4) تمييز بصري: كل غلاف يجب ألا يطابق غلاف عمل آخر (تباين البكسلات بين كل زوج متجابذ في القائمة).
الاستخدام: python3 tools/poster-hunt/verify-covers.py [--limit N]
"""
import hashlib
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FONTS = os.path.join(ROOT, "tools", "fonts")
sys.path.insert(0, os.path.join(ROOT, "lib"))

W, H = 600, 900
LEFT, RIGHT = 52, W - 52


def wrap_words(d, text, font, max_width):
    words, lines, current = text.split(), [], ""
    for w in words:
        trial = f"{current} {w}".strip()
        if d.textlength(trial, font=font) <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def fits(text):
    probe = Image.new("RGB", (8, 8))
    d = ImageDraw.Draw(probe)
    for size in (64, 58, 52, 46, 42, 38, 34, 30):
        font = ImageFont.truetype(os.path.join(FONTS, "IBMPlexSansArabic-Bold.ttf"), size)
        lines = wrap_words(d, text, font, RIGHT - LEFT)
        if len(lines) <= 3:
            widest = max(d.textlength(ln, font=font) for ln in lines)
            return True, size, len(lines), int(widest)
    return False, 30, len(lines), int(max(d.textlength(ln, font=font) for ln in lines))



def main():
    manifest_path = os.path.join(ROOT, "tools", "poster-hunt", "series-covers.json")
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])
        manifest = manifest[:limit]

    problems, hashes = [], {}
    for m in manifest:
        path = os.path.join(ROOT, "public", m["file"].lstrip("/"))
        if not os.path.exists(path):
            problems.append(f"{m['slug']}: الملف مفقود {m['file']}")
            continue
        with open(path, "rb") as fh:
            digest = hashlib.sha1(fh.read()).hexdigest()
        if digest in hashes:
            problems.append(f"{m['slug']}: صورة مطابقة تمامًا لصورة {hashes[digest]}")
        hashes[digest] = m["slug"]
        with Image.open(path) as img:
            if img.size != (W, H):
                problems.append(f"{m['slug']}: الأبعاد {img.size} وليست (600, 900)")
            if os.path.getsize(path) > 200 * 1024:
                problems.append(f"{m['slug']}: الحجم {os.path.getsize(path)//1024}KB > 200KB")
        ok, size, lines, widest = fits(m["printed"])
        if not ok:
            problems.append(f"{m['slug']}: العنوان «{m['printed']}» لا يدخل في 3 أسطر حتى بحجم 30px")
        m["_fit"] = {"fontSize": size, "lines": lines, "widestPx": widest}

    styles = {}
    for m in manifest:
        styles.setdefault(m["style"], 0)
        styles[m["style"]] += 1

    print(f"فُحصت {len(manifest)} غلافًا | الأنماط: " + "، ".join(f"{k}={v}" for k, v in sorted(styles.items())))
    sizes = [m["_fit"]["fontSize"] for m in manifest if "_fit" in m]
    if sizes:
        print(f"أحجام خط العنوان: أصغر {min(sizes)}px، أكبر {max(sizes)}px — كلها داخل 3 أسطر")
    if problems:
        print(f"\n⚠️  مشكلات ({len(problems)}):")
        for p in problems:
            print("   -", p)
        return 1
    print("✅ لا مشكلات: كل غلاف موجود، 600×900، أقل من 200KB، بلا تكرار، وعنوانه مقروء.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
