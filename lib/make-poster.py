#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================================================
 مولّد بوسترات تصميمية أصلية — lib/make-poster.py
============================================================================
 لماذا هذا الملف؟
   لعرض أي عمل في الموقع تحتاج "صورة بوستر" تملك حقوقها. هذا السكربت يولّد
   بوسترًا فنيًا أصليًا بالكود (تدرّجات، ضوء، ملمس، حبيبات فيلم) بدون استخدام
   أي صورة من الإنترنت — أي أن الحقوق مضمونة بالكامل.

 كيف تستخدمه؟
   python3 lib/make-poster.py <slug> [--style warm|cold|amber|olive] [--out public/posters]
   مثال:
     python3 lib/make-poster.py my-new-movie --style cold

   بطاقات المسلسلات تستخدم لوحات/زخارف إضافية مع طباعة العنوان:
     python3 lib/make-poster.py my-series --style noir --title "My Series" --year 2024 \
         --kicker "TV SERIES" --out public/posters
   الأنماط: warm · cold · amber · olive · noir · teal · rose · sand · crimson · ink
   الزخارف (motif): rings · triad · bars · dunes · grid · frame · halo
   يتطلب: Pillow (python3 -m pip install pillow) وخطوط IBMPlexSansArabic في tools/fonts.

 ملاحظات:
   - الناتج 600×900 (نسبة 2:3) بجودة مناسبة للويب (عادة 60–150KB).
   - يمكنك بدلًا من ذلك وضع صورة تملك حقوقها في public/posters/<slug>.jpg
     وكتابة مسارها في حقل poster داخل ملف العمل.
   - هذا السكربت أداة تطوير فقط، ولا يُستخدم في بناء الموقع ولا في Vercel.
============================================================================
"""
import argparse
import math
import os
import random
import sys
import zlib

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 600, 900

PALETTES = {
    "warm": {"bg": (28, 20, 16), "glow": (226, 150, 74), "accent": (240, 196, 132), "cool": (32, 52, 62)},
    "cold": {"bg": (12, 18, 26), "glow": (120, 176, 214), "accent": (198, 226, 244), "cool": (22, 34, 46)},
    "amber": {"bg": (18, 16, 24), "glow": (232, 164, 72), "accent": (250, 214, 150), "cool": (30, 40, 66)},
    "olive": {"bg": (20, 22, 18), "glow": (168, 176, 108), "accent": (226, 224, 178), "cool": (40, 44, 36)},
    # لوحات إضافية تُستخدم لبوسترات المسلسلات (تصميم أصلي للموقع)
    "noir": {"bg": (10, 11, 14), "glow": (196, 206, 224), "accent": (226, 176, 96), "cool": (18, 22, 30)},
    "teal": {"bg": (8, 20, 24), "glow": (86, 198, 190), "accent": (176, 240, 232), "cool": (12, 34, 40)},
    "rose": {"bg": (26, 14, 22), "glow": (226, 128, 146), "accent": (250, 196, 206), "cool": (36, 18, 34)},
    "sand": {"bg": (26, 20, 12), "glow": (222, 176, 108), "accent": (244, 220, 172), "cool": (44, 32, 18)},
    "crimson": {"bg": (18, 8, 10), "glow": (196, 62, 62), "accent": (240, 170, 156), "cool": (30, 10, 14)},
    "ink": {"bg": (12, 14, 22), "glow": (104, 122, 178), "accent": (196, 208, 240), "cool": (16, 20, 34)},
}


def vgradient(size, top, bottom):
    w, h = size
    base = Image.new("RGB", (1, h))
    px = base.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return base.resize((w, h), Image.BILINEAR)


def radial_glow(size, center, radius, color, strength=200):
    layer = Image.new("L", size, 0)
    d = ImageDraw.Draw(layer)
    cx, cy = center
    steps = 60
    for i in range(steps, 0, -1):
        r = radius * i / steps
        a = int(strength * (1 - i / steps) ** 1.8)
        d.ellipse([cx - r, cy - r * 0.95, cx + r, cy + r * 0.95], fill=a)
    layer = layer.filter(ImageFilter.GaussianBlur(radius / 6))
    tint = Image.new("RGB", size, color)
    return tint, layer


def add_noise(img, amount=10, seed=7):
    rnd = random.Random(seed)
    w, h = img.size
    noise = Image.new("L", (w, h))
    np_ = noise.load()
    for y in range(0, h, 1):
        for x in range(0, w, 1):
            np_[x, y] = rnd.randint(0, 255)
    noise = noise.filter(ImageFilter.GaussianBlur(0.6))
    grain = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(img, Image.blend(img, grain, 0.5), amount / 100)


def vignette(img, strength=0.72):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.35, -h * 0.22, w * 1.35, h * 1.22], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(w * 0.12))
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    return Image.composite(img, Image.blend(img, dark, strength), mask)


def composite_glow(img, tint, mask, alpha=1.0):
    layer = img.copy()
    layer.paste(tint, (0, 0), mask.point(lambda v: int(v * alpha)))
    return layer


# ------------------------------ الأنماط ------------------------------

def style_warm(img, pal):
    """أزقة قديمة: أقواس، حبال غسيل، شعاع صباحي."""
    d = ImageDraw.Draw(img, "RGBA")
    glow = Image.new("L", img.size, 0)
    gd = ImageDraw.Draw(glow)
    gd.polygon([(70, 0), (250, 0), (470, H), (250, H)], fill=90)
    glow = glow.filter(ImageFilter.GaussianBlur(70))
    img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow, 0.85)

    d = ImageDraw.Draw(img, "RGBA")
    # جدران وأقواس
    for i, x in enumerate((0, 150, 300, 450)):
        shade = 26 + i * 7
        d.rectangle([x, 120, x + 150, H], fill=(shade + 14, shade + 8, shade, 255))
    for x in (150, 300, 450):
        d.rectangle([x - 3, 120, x + 3, H], fill=(12, 10, 9, 255))
    for x in (60, 210, 360, 510):
        d.rounded_rectangle([x - 34, 210, x + 34, 470], radius=34, outline=(20, 16, 13, 220), width=4)
        d.rounded_rectangle([x - 26, 226, x + 26, 460], radius=26, fill=(38, 30, 24, 160))
    # حبال غسيل
    for y, sag in ((300, 26), (360, 18), (430, 30)):
        d.line([(60, y), (540, y + 6)], fill=(90, 74, 58, 150), width=2)
        for k in range(6):
            x = 100 + k * 75
            d.rectangle([x, y + sag * 0.2, x + 34, y + sag * 0.2 + 54], fill=(58, 46, 36, 210))
    # بوابة خشبية
    d.rounded_rectangle([232, 640, 368, 830], radius=8, fill=(52, 36, 26, 255), outline=(96, 68, 44, 255), width=3)
    for k in range(4):
        d.line([(246 + k * 34, 646), (246 + k * 34, 824)], fill=(34, 24, 18, 255), width=3)
    # أرضية وضوء
    d.polygon([(0, 830), (W, 830), (W, H), (0, H)], fill=(30, 24, 20, 255))
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    return img


def style_cold(img, pal):
    """محطة نائية: طبق استقبال، حلقات إشارة، أفق ثلجي."""
    glow = Image.new("L", img.size, 0)
    gd = ImageDraw.Draw(glow)
    for r, a in ((230, 70), (170, 90), (110, 120), (55, 160)):
        gd.ellipse([300 - r, 330 - r * 0.32, 300 + r, 330 + r * 0.32], outline=a, width=6)
    glow = glow.filter(ImageFilter.GaussianBlur(6))
    img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow, 0.75)

    d = ImageDraw.Draw(img, "RGBA")
    d.polygon([(0, 470), (W, 452), (W, H), (0, H)], fill=(18, 26, 36, 255))       # سهل ثلجي
    d.polygon([(0, 660), (W, 640), (W, H), (0, H)], fill=(14, 20, 28, 255))
    # أعمدة وحبال
    d.line([(150, 452), (150, 612)], fill=(38, 48, 60, 255), width=6)
    d.line([(470, 440), (470, 600)], fill=(38, 48, 60, 255), width=6)
    # طبق استقبال
    d.polygon([(420, 300), (560, 470), (280, 470)], outline=(120, 150, 176, 235), fill=(30, 40, 52, 235))
    d.ellipse([330, 350, 510, 470], outline=(150, 180, 206, 220), width=5)
    d.line([(420, 470), (420, 640)], fill=(140, 166, 190, 235), width=8)
    # حاوية المحطة ونافذة مضيئة
    d.rectangle([90, 620, 250, 700], fill=(24, 30, 40, 255), outline=(70, 84, 100, 255), width=3)
    d.rectangle([112, 640, 158, 676], fill=(238, 186, 108, 255))
    img = img.filter(ImageFilter.GaussianBlur(0.35))
    return img


def style_amber(img, pal):
    """صيدلية ليلية: نافذة دافئة، مطر، انعكاسات."""
    glow = Image.new("L", img.size, 0)
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle([150, 380, 450, 660], radius=18, fill=210)
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow, 0.9)

    d = ImageDraw.Draw(img, "RGBA")
    # مطر
    rnd = random.Random(11)
    for _ in range(260):
        x = rnd.randint(-40, W)
        y = rnd.randint(0, H)
        L = rnd.randint(16, 46)
        d.line([(x, y), (x + 7, y + L)], fill=(150, 178, 206, rnd.randint(16, 46)), width=1)
    # مباني خلفية
    for i, (x, w, htop) in enumerate(((0, 120, 250), (120, 90, 300), (430, 90, 280), (520, 80, 240))):
        d.rectangle([x, htop, x + w, 700], fill=(16, 18, 30, 255))
        for wy in range(int(htop) + 24, 690, 46):
            d.rectangle([x + 16, wy, x + 34, wy + 20], fill=(40, 46, 66, 255))
    # الواجهة المضيئة
    d.rounded_rectangle([150, 380, 450, 660], radius=18, fill=(54, 42, 26, 255), outline=(120, 92, 52, 255), width=4)
    d.rounded_rectangle([170, 400, 430, 640], radius=12, fill=(246, 190, 110, 235))
    # قوارير على الرف
    rnd = random.Random(5)
    for k in range(7):
        x = 186 + k * 34
        hh = rnd.randint(40, 78)
        d.rounded_rectangle([x, 612 - hh, x + 20, 612], radius=6, fill=(120, 84, 40, 235))
        d.rounded_rectangle([x + 5, 612 - hh - 12, x + 15, 612 - hh], radius=4, fill=(96, 66, 32, 235))
    d.rectangle([170, 612, 430, 618], fill=(126, 96, 52, 255))
    # رصيف وانعكاس
    d.rectangle([0, 660, W, H], fill=(14, 16, 26, 255))
    refl = img.crop((150, 380, 450, 660)).transpose(Image.FLIP_TOP_BOTTOM).resize((300, 180)).filter(ImageFilter.GaussianBlur(7))
    img.paste(Image.blend(img.crop((150, 660, 450, 840)), refl, 0.35), (150, 660))
    return img


def style_olive(img, pal):
    """أرشيف: أرفف متلاشية، ملف مضيء، مصباح مكتبي."""
    d = ImageDraw.Draw(img, "RGBA")
    # أرفف بمنظور
    for i in range(7):
        x0 = 60 + i * 76
        x1 = x0 + 52 + i * 6
        shade = 34 - i * 3
        d.polygon([(x0, 140 - i * 10), (x1, 140 - i * 10), (x1, 760 + i * 6), (x0, 760 + i * 6)], fill=(shade, shade + 3, shade - 4, 255))
        for y in range(170 - i * 10, 760, 54):
            d.line([(x0, y), (x1, y)], fill=(14, 16, 12, 220), width=3)
            for k in range(2):
                fx = x0 + 6 + k * 24
                d.rectangle([fx, y + 8, fx + 18, y + 46], fill=(max(18, shade - 14), max(20, shade - 10), max(16, shade - 16), 235))
    # شهب ضوء
    glow = Image.new("L", img.size, 0)
    gd = ImageDraw.Draw(glow)
    gd.polygon([(300, 0), (420, 0), (520, H), (360, H)], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow, 0.6)

    d = ImageDraw.Draw(img, "RGBA")
    # مكتب
    d.polygon([(0, 700), (W, 690), (W, H), (0, H)], fill=(26, 24, 18, 255))
    d.rectangle([170, 640, 430, 702], fill=(38, 33, 24, 255), outline=(64, 56, 40, 255), width=3)
    # مصباح
    d.line([(232, 640), (232, 578)], fill=(70, 62, 44, 255), width=6)
    d.polygon([(198, 560), (268, 560), (254, 586), (212, 586)], fill=(52, 46, 32, 255))
    # ملف مضيء
    glow2 = Image.new("L", img.size, 0)
    g2 = ImageDraw.Draw(glow2)
    g2.rounded_rectangle([286, 596, 372, 650], radius=4, fill=200)
    glow2 = glow2.filter(ImageFilter.GaussianBlur(26))
    img = composite_glow(img, Image.new("RGB", img.size, pal["accent"]), glow2, 0.75)
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle([286, 598, 372, 650], radius=4, fill=(224, 220, 180, 245), outline=(150, 146, 104, 255), width=2)
    for k in range(4):
        d.line([(298, 612 + k * 10), (360, 612 + k * 10)], fill=(120, 116, 82, 235), width=2)
    return img


# ----------------------- زخارف هندسية للبوسترات التصميمية -----------------------

def style_motif(img, pal, motif="rings", seed=1):
    """زخارف مجردة بسيطة تُرسم خلف العنوان (تُستخدم لبطاقات المسلسلات)."""
    rnd = random.Random(seed)
    glow = Image.new("L", img.size, 0)
    gd = ImageDraw.Draw(glow)

    if motif == "rings":
        for i, r in enumerate((300, 236, 176, 118, 62)):
            gd.ellipse([W // 2 - r, 320 - r, W // 2 + r, 320 + r], outline=190 - i * 26, width=9)
        img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow.filter(ImageFilter.GaussianBlur(9)), 0.72)
        d = ImageDraw.Draw(img, "RGBA")
        for i, r in enumerate((300, 236, 176, 118, 62)):
            d.ellipse([W // 2 - r, 320 - r, W // 2 + r, 320 + r], outline=pal["accent"] + (70 - i * 10,), width=2)
    elif motif == "triad":
        d0 = ImageDraw.Draw(img, "RGBA")
        for i, s in enumerate((250, 190, 130)):
            alpha = 130 - i * 34
            d0.polygon(
                [(W // 2, 150 + i * 40), (W // 2 - s, 150 + i * 40 + int(s * 1.6)), (W // 2 + s, 150 + i * 40 + int(s * 1.6))],
                outline=pal["accent"] + (alpha,),
                width=3,
            )
        gd.polygon([(W // 2, 190), (W // 2 - 150, 470), (W // 2 + 150, 470)], fill=150)
        img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow.filter(ImageFilter.GaussianBlur(46)), 0.6)
    elif motif == "bars":
        d0 = ImageDraw.Draw(img, "RGBA")
        for x in range(30, W - 30, 34):
            h = rnd.randint(120, 470)
            d0.rectangle([x, 640 - h, x + 12, 640], fill=pal["cool"] + (200,))
            d0.line([(x, 640 - h), (x + 12, 640 - h)], fill=pal["accent"] + (150,), width=2)
        gd.rectangle([0, 640, W, 660], fill=120)
        img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow.filter(ImageFilter.GaussianBlur(30)), 0.5)
    elif motif == "dunes":
        d0 = ImageDraw.Draw(img, "RGBA")
        for i, base in enumerate((470, 560, 650, 730)):
            shade = 22 + i * 9
            pts = [(0, H)]
            for x in range(0, W + 1, 25):
                y = base + int(math.sin((x / W) * math.pi * (1.4 + i * 0.5) + i) * (34 - i * 5))
                pts.append((x, y))
            pts.append((W, H))
            d0.polygon(pts, fill=(shade + 12, shade + 6, max(0, shade - 6), 255))
        gd.ellipse([400, 130, 520, 250], fill=200)
        img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow.filter(ImageFilter.GaussianBlur(26)), 0.85)
    elif motif == "grid":
        d0 = ImageDraw.Draw(img, "RGBA")
        for i in range(11):
            y = 300 + i * 26 + i * i
            if y > H:
                break
            d0.line([(0, y), (W, y)], fill=pal["accent"] + (52 + i * 8,), width=1)
        for i in range(-10, 11):
            d0.line([(W // 2, 320), (W // 2 + i * 130, H)], fill=pal["accent"] + (34,), width=1)
        gd.ellipse([W // 2 - 190, 150, W // 2 + 190, 330], fill=140)
        img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow.filter(ImageFilter.GaussianBlur(40)), 0.66)
    elif motif == "frame":
        d0 = ImageDraw.Draw(img, "RGBA")
        d0.rectangle([44, 44, W - 44, H - 44], outline=pal["accent"] + (120,), width=2)
        d0.rectangle([62, 62, W - 62, H - 62], outline=pal["cool"] + (220,), width=1)
        for k in range(26):
            y = 90 + k * 26
            d0.line([(90 + (k % 5) * 14, y), (90 + (k % 5) * 14 + 60, y)], fill=pal["glow"] + (26,), width=8)
        gd.ellipse([-120, 240, 320, 700], fill=90)
        img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow.filter(ImageFilter.GaussianBlur(70)), 0.55)
    else:  # "halo"
        gd.ellipse([W // 2 - 150, 240, W // 2 + 150, 540], fill=190)
        img = composite_glow(img, Image.new("RGB", img.size, pal["glow"]), glow.filter(ImageFilter.GaussianBlur(64)), 0.9)
        d0 = ImageDraw.Draw(img, "RGBA")
        d0.ellipse([W // 2 - 150, 240, W // 2 + 150, 540], outline=pal["accent"] + (150,), width=3)
    return img


MOTIFS = ("rings", "triad", "bars", "dunes", "grid", "frame", "halo")


def make_motif_style(style_name):
    def _style(img, pal, seed=1, motif=None):
        return style_motif(img, pal, motif or MOTIFS[seed % len(MOTIFS)], seed)

    return _style


# ------------------------------ طباعة العنوان ------------------------------

FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tools", "fonts")


def load_font(name, size):
    """يحمّل خط IBM Plex Sans Arabic المرفق بالمستودع (يغطي الحروف اللاتينية أيضًا)."""
    for candidate in (os.path.join(FONTS_DIR, name), name):
        if os.path.exists(candidate) or name.endswith(".ttf"):
            try:
                return ImageFont.truetype(candidate, size)
            except OSError:
                continue
    return ImageFont.load_default()


def track(text, gap=3):
    """تباعد أحرف صناعي للعناوين الصغيرة (بدلًا من letter-spacing غير المدعوم في PIL)."""
    return (" " * gap).join(list(text))


def wrap_words(draw, text, font, max_width):
    words, lines, current = text.split(), [], ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def render_text(img, title=None, year=None, kicker=None, note=None):
    """طبقة العنوان أسفل البوستر: تُستخدم فقط في البطاقات التصميمية الأصلية."""
    if not (title or kicker or note):
        return img
    d = ImageDraw.Draw(img, "RGBA")

    scrim = Image.new("L", img.size, 0)
    sd = ImageDraw.Draw(scrim)
    for y in range(H - 430, H):
        t = (y - (H - 430)) / 430
        sd.line([(0, y), (W, y)], fill=int(235 * t**1.5))
    scrim = scrim.filter(ImageFilter.GaussianBlur(18))
    img = Image.composite(Image.new("RGB", img.size, (7, 9, 12)), img, scrim)
    d = ImageDraw.Draw(img, "RGBA")

    left, right = 52, W - 52
    y_note = H - 54
    if note:
        f_note = load_font("IBMPlexSansArabic-Regular.ttf", 15)
        d.multiline_text((left, y_note), note, font=f_note, fill=(176, 186, 202, 235), spacing=5)
        note_height = 0
        for line in note.split("\n"):
            note_height += d.textbbox((0, 0), line, font=f_note)[3] + 5
    else:
        note_height = 0

    y = H - 78 - note_height
    d.rectangle([left, y, left + 78, y + 4], fill=(236, 198, 128, 235))
    y -= 30

    f_meta = load_font("IBMPlexSansArabic-SemiBold.ttf", 20)
    meta = " · ".join([p for p in (kicker, str(year) if year else None) if p])
    if meta:
        meta_w = d.textlength(meta, font=f_meta)
        d.text((right - meta_w, y - 6), meta, font=f_meta, fill=(214, 222, 234, 235))

    if title:
        f_title = None
        lines = []
        for size in (64, 58, 52, 46, 42, 38, 34, 30):
            font = load_font("IBMPlexSansArabic-Bold.ttf", size)
            wrapped = wrap_words(d, title, font, right - left)
            if len(wrapped) <= 3:
                f_title, lines = font, wrapped
                break
        if f_title is None:
            f_title = load_font("IBMPlexSansArabic-Bold.ttf", 30)
            lines = wrap_words(d, title, f_title, right - left)[:3]
        line_h = f_title.size + 8
        top = y - 18 - line_h * len(lines)
        for i, line in enumerate(lines):
            d.text((left, top + i * line_h), line, font=f_title, fill=(246, 248, 252, 255))

    f_mark = load_font("IBMPlexSansArabic-SemiBold.ttf", 15)
    d.text((left, 46), track("CINEMANA", 2), font=f_mark, fill=(196, 206, 222, 150))
    return img


STYLES = {
    "warm": style_warm,
    "cold": style_cold,
    "amber": style_amber,
    "olive": style_olive,
    "noir": make_motif_style("noir"),
    "teal": make_motif_style("teal"),
    "rose": make_motif_style("rose"),
    "sand": make_motif_style("sand"),
    "crimson": make_motif_style("crimson"),
    "ink": make_motif_style("ink"),
}


MOTIF_STYLES = {"noir", "teal", "rose", "sand", "crimson", "ink"}


def build(slug, style="warm", out_dir="public/posters", title=None, year=None, kicker=None, note=None, motif=None):
    pal = PALETTES.get(style, PALETTES["warm"])
    # تنويع مميز لكل عمل: بذرة مشتقة من المعرّف حتى لا يتطابق بوستر عملين مختلفين
    seed = zlib.crc32(slug.encode("utf-8")) & 0xFFFFFFFF
    rnd = random.Random(seed)
    img = vgradient((W, H), pal["bg"], tuple(max(0, c - 12) for c in pal["bg"]))
    if style in MOTIF_STYLES:
        chosen = motif if motif in MOTIFS else MOTIFS[seed % len(MOTIFS)]
        img = STYLES[style](img, pal, seed=seed, motif=chosen)
    else:
        img = STYLES.get(style, style_warm)(img, pal)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img = vignette(img, 0.6)
    # تقريب/قصّ ببذرة العمل: تكوين مختلف قليلًا لكل بوستر
    zoom = rnd.uniform(1.0, 1.16) if title is None else rnd.uniform(1.0, 1.08)
    cw, ch = int(W / zoom), int(H / zoom)
    ox = rnd.randint(0, W - cw)
    oy = rnd.randint(0, max(1, int((H - ch) * 0.55)))
    img = img.crop((ox, oy, ox + cw, oy + ch)).resize((W, H), Image.LANCZOS)
    img = ImageEnhance.Brightness(img).enhance(rnd.uniform(0.90, 1.10))
    img = ImageEnhance.Color(img).enhance(rnd.uniform(0.80, 1.20))
    img = ImageEnhance.Contrast(img).enhance(rnd.uniform(0.92, 1.08))
    img = add_noise(img, 8, seed=seed % 10000)
    img = render_text(
        img,
        title=title,
        year=year,
        kicker=kicker,
        note=note if note is not None else ("Original design cover created for Cinemana — not the official poster." if title else None),
    )
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{slug}.jpg")
    img.save(path, "JPEG", quality=84, optimize=True, progressive=True)
    print(f"✔ {path}  ({os.path.getsize(path) // 1024} KB)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="توليد بوستر تصميمي أصلي بالكود")
    ap.add_argument("slug")
    ap.add_argument("--style", default="warm", choices=sorted(STYLES))
    ap.add_argument("--out", default="public/posters")
    ap.add_argument("--title", default=None, help="عنوان العمل المطبوع على البطاقة (لاتيني)")
    ap.add_argument("--year", default=None, help="سنة العرض المطبوعة أسفل العنوان")
    ap.add_argument("--kicker", default=None, help="سطر صغير فوق العنوان، مثل TV SERIES")
    ap.add_argument("--note", default=None, help="ملاحظة التوضيح أسفل البطاقة")
    ap.add_argument("--motif", default=None, choices=sorted(MOTIFS), help="الزخرفة الهندسية للخلفية")
    a = ap.parse_args()
    build(
        a.slug,
        a.style,
        a.out,
        title=a.title,
        year=a.year,
        kicker=a.kicker,
        note=a.note,
        motif=a.motif,
    )
