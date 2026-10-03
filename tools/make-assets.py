#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================================================
 مولّد أصول الهوية البصرية — tools/make-assets.py
============================================================================
 يولّد صور الهوية بالكود، بدون استخدام أي صورة من الإنترنت (الحقوق مضمونة):
   - public/og-default.jpg     صورة المشاركة الافتراضية (1200×630)
   - app/apple-icon.png        أيقونة آبل (180×180)
   - app/favicon.ico           أيقونة المتصفح (أحجام متعددة)
   - public/icons/icon-192.png و icon-512.png  (أيقونات إضافة الموقع للشاشة الرئيسية)

 النص العربي يُرسَم بالخط العربي IBM Plex Sans Arabic (رخصة OFL — انظر tools/fonts/)
 مع محرك تشكيل عربي حقيقي (libraqm) لضمان ظهور الحروف متصلة وباتجاه صحيح.

 المتطلبات (مرة واحدة):
   pip install pillow

 الاستخدام:
   python3 tools/make-assets.py

 ملاحظة: هذا ملف أدوات تطوير فقط — لا يعمل وقت البناء ولا يُشحن مع الموقع.
============================================================================
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'tools', 'fonts')
AR_BOLD = os.path.join(FONTS, 'IBMPlexSansArabic-Bold.ttf')
AR_SEMI = os.path.join(FONTS, 'IBMPlexSansArabic-SemiBold.ttf')
AR_REG = os.path.join(FONTS, 'IBMPlexSansArabic-Regular.ttf')
LATIN_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'  # خط لاتيني عام للنظام
LATIN_FALLBACK_OK = os.path.exists(LATIN_BOLD)

ACCENT = (95, 168, 211)        # #5FA8D3 — نفس اللون المميز في site.config.mjs
ACCENT_LIGHT = (124, 190, 227)
BG_TOP = (18, 22, 28)
BG_BOTTOM = (8, 10, 13)
TEXT = (233, 238, 244)
MUTED = (147, 160, 173)

RTL = dict(direction='rtl', language='ar')


def font(path, size):
    return ImageFont.truetype(path, size)


def ar_text(draw, xy, text, f, fill, anchor='ra'):
    """نص عربي بترتيب RTL صحيح (anchor ra = محاذاة يمين عند نقطة البداية)."""
    draw.text(xy, text, font=f, fill=fill, anchor=anchor, **RTL)


def gradient(size, top, bottom):
    w, h = size
    base = Image.new('RGB', (1, h))
    px = base.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    return base.resize((w, h), Image.BILINEAR)


def glow(img, center, radius, color, strength=110):
    layer = Image.new('L', img.size, 0)
    d = ImageDraw.Draw(layer)
    cx, cy = center
    for i in range(60, 0, -1):
        r = radius * i / 60
        d.ellipse([cx - r, cy - r * 0.8, cx + r, cy + r * 0.8], fill=int(strength * (1 - i / 60) ** 1.7))
    layer = layer.filter(ImageFilter.GaussianBlur(radius / 8))
    out = img.copy()
    out.paste(Image.new('RGB', img.size, color), (0, 0), layer)
    return out


def film_strip(w, h, color=(255, 255, 255, 30), step=34, hole=(9, 12)):
    """شريط فيلم زخرفي رقيق (يعطي إحساسًا سينمائيًا بدون أي صور جاهزة)."""
    strip = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(strip)
    d.rectangle([0, 0, w - 1, h - 1], fill=color)
    for x in range(8, w - 8, step):
        d.rounded_rectangle([x, (h - hole[1]) / 2, x + hole[0], (h + hole[1]) / 2], radius=3, fill=(6, 9, 12, 255))
    return strip


def mark_tile(size, with_play=True, radius_ratio=0.24):
    """علامة الموقع: مربع متدرّج باللون المميز + مثلث تشغيل."""
    s = size
    tile = gradient((s, s), ACCENT_LIGHT, (29, 58, 77))
    mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * radius_ratio), fill=255)
    out = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    out.paste(tile, (0, 0), mask)
    if with_play:
        d = ImageDraw.Draw(out)
        cx, cy = s / 2, s / 2 - s * 0.01
        r = s * 0.18
        d.polygon([(cx - r * 0.7, cy - r), (cx - r * 0.7, cy + r), (cx + r * 0.95, cy)], fill=(6, 22, 31, 255))
    return out


def build_og():
    """صورة المشاركة الافتراضية — تُستخدم في Open Graph وTwitter Card."""
    w, h = 1200, 630
    img = gradient((w, h), BG_TOP, BG_BOTTOM)
    img = glow(img, (1010, 70), 560, ACCENT, 100)
    img = glow(img, (110, 600), 430, (48, 92, 120), 70)

    d = ImageDraw.Draw(img, 'RGBA')
    d.rounded_rectangle([26, 26, w - 26, h - 26], radius=24, outline=(255, 255, 255, 26), width=2)

    # شريط فيلم علوي وسفلي (زخرفة بسيطة)
    img.paste(film_strip(300, 22), (78, 60), film_strip(300, 22))

    tile = mark_tile(168)
    img.paste(tile, (w - 168 - 78, 96), tile)

    f_name = font(AR_BOLD, 96)
    f_semi = font(AR_SEMI, 40)
    f_reg = font(AR_REG, 30)

    # الاسم العربي (يمين) — والعنوان اللاتيني أسفله بالقرب من العلامة
    ar_text(d, (w - 78 - 168 - 34, 118), 'سينمانا', f_name, TEXT)
    if LATIN_FALLBACK_OK:
        f_lat = ImageFont.truetype(LATIN_BOLD, 26)
        # الاسم اللاتيني أسفل الاسم العربي، بنفس حدّ المحاذاة اليمين
        d.text((w - 78 - 168 - 34, 236), 'CINEMANA', font=f_lat, fill=ACCENT, anchor='ra')

    ar_text(d, (w - 78, 356), 'اكتشف الفيلم الذي ستبقى تتحدث عنه', f_semi, TEXT)
    ar_text(d, (w - 78, 420), 'معلومات منظّمة · مراجعات تحريرية أصلية · روابط مشاهدة رسمية فقط', f_reg, MUTED)

    # خط فاصل + سطر الثوابت
    d.rectangle([w - 78 - 240, 500, w - 78, 505], fill=ACCENT)
    ar_text(d, (w - 78, 536), 'لا نستضيف أفلامًا · لا روابط غير رسمية · بلا تتبّع', f_reg, MUTED)

    os.makedirs(os.path.join(ROOT, 'public'), exist_ok=True)
    out = os.path.join(ROOT, 'public', 'og-default.jpg')
    img.convert('RGB').save(out, 'JPEG', quality=88, optimize=True, progressive=True)
    print('✔', os.path.relpath(out, ROOT))


def build_icons():
    # أيقونة آبل
    canvas = Image.new('RGBA', (180, 180), (10, 12, 15, 255))
    canvas.alpha_composite(mark_tile(180))
    canvas.convert('RGB').save(os.path.join(ROOT, 'app', 'apple-icon.png'), 'PNG')
    print('✔ app/apple-icon.png')

    # favicon.ico
    base = Image.new('RGBA', (256, 256), (10, 12, 15, 255))
    base.alpha_composite(mark_tile(256))
    base.save(os.path.join(ROOT, 'app', 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print('✔ app/favicon.ico')

    # أيقونات الشاشة الرئيسية
    icons_dir = os.path.join(ROOT, 'public', 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    for size in (192, 512):
        c = Image.new('RGBA', (size, size), (10, 12, 15, 255))
        c.alpha_composite(mark_tile(size))
        path = os.path.join(icons_dir, f'icon-{size}.png')
        c.convert('RGB').save(path, 'PNG', optimize=True)
        print('✔', os.path.relpath(path, ROOT))


if __name__ == '__main__':
    for p in (AR_BOLD, AR_SEMI, AR_REG):
        if not os.path.exists(p):
            print('⛔ خط مفقود:', p)
            print('   ملفات الخطوط يجب أن تكون داخل tools/fonts/ (رخصة OFL — انظر tools/fonts/OFL-IBM-Plex.txt).')
            sys.exit(1)
    build_og()
    build_icons()
    print('تم توليد كل أصول الهوية بنجاح.')
