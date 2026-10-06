/**
 * ============================================================================
 *  شعار «أكاشا سينما / Akasha Cinema» — علامة موحّدة للاتجاهين RTL وLTR
 * ============================================================================
 *  التصميم: بلاطة متدرّجة باللون المميز للموقع تحمل مثلث تشغيل (سينما/بث)
 *  تعانقه «نجمة الأثير» الرباعية (أكاشا = السماء/الأثير) عند رأسه —
 *  كأنها ومضة ضوء جهاز العرض. العلامة نفسها في اللغتين لضمان الاتساق
 *  البصري، بينما تتبدّل محاذاة الشعار النصي تلقائيًا مع اتجاه الصفحة
 *  (flex يتبع dir) — RTL للعربية وLTR للإنجليزية.
 *
 *  نفس الهندسة موجودة في أصول SVG المستقلة: public/logo-mark.svg
 *  وpublic/logo-ar.svg وpublic/logo-en.svg (تُقرأ مساراتها من site.config.mjs).
 * ============================================================================
 */

const TILE_TOP = '#7CBEE3';   // مطابق لتدرّج البلاطة في التصميم الحالي
const TILE_BOTTOM = '#1D3A4D';
const TILE_STROKE = 'rgba(255,255,255,0.14)';
const PLAY = '#06161F';       // مثلث التشغيل الداكن
const STAR = '#EAF6FF';       // نجمة الأثير المضيئة

/** مثلث التشغيل + نجمة الأثير (بدون البلاطة — لوضعه داخل بلاطة .brand-mark الحالية) */
export function LogoGlyph({ size = 22 }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <polygon points="35,28 35,68 68,48" fill={PLAY} />
      <path d="M68 12 L71.2 22.8 L82 26 L71.2 29.2 L68 40 L64.8 29.2 L54 26 L64.8 22.8 Z" fill={STAR} />
    </svg>
  );
}

/** العلامة الكاملة: بلاطة متدرّجة + مثلث تشغيل + نجمة (للاستخدام المستقل) */
export function LogoMark({ size = 38, title = null }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="akasha-mark-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={TILE_TOP} />
          <stop offset="1" stopColor={TILE_BOTTOM} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="94" height="94" rx="22.5" fill="url(#akasha-mark-gradient)" />
      <rect x="1.5" y="1.5" width="93" height="93" rx="22" fill="none" stroke={TILE_STROKE} />
      <polygon points="35,28 35,68 68,48" fill={PLAY} />
      <path d="M68 12 L71.2 22.8 L82 26 L71.2 29.2 L68 40 L64.8 29.2 L54 26 L64.8 22.8 Z" fill={STAR} />
      {title ? <title>{title}</title> : null}
    </svg>
  );
}
