/**
 * ============================================================================
 *  طبقة الإعلانات — قراءة إعدادات الإعلان من مكان مركزي واحد (site.config.mjs)
 * ============================================================================
 *  - لا يوجد في هذا الملف أي معرّف ناشر أو معرّف منطقة (Zone ID) ولا أي كود جاهز.
 *  - كل الأكواد تُوضع في site.config.mjs ← ads.headHtml و ads.zones[...] كما هي من
 *    لوحة Monetag، فتُستخدم في كل الصفحات التي تحتوي <AdSlot /> تلقائيًا.
 *  - ما دامت القيم فارغة (أو ads.enabled = false) لا يُعرض أي شيء للزائر إطلاقًا.
 * ============================================================================
 */
import siteConfig from '../site.config.mjs';

const ads = siteConfig.ads ?? {};

/** هل الإعلانات مفعّلة أصلًا؟ (تعطيلها = لا يُحمَّل أي سكربت إعلاني في الموقع كله) */
export const adsEnabled = () => ads.enabled === true;

/** عرض الشبكة الإعلانية للنص القانوني/التوضيحي (Monetag فقط) */
export const adsProvider = () => ads.provider ?? 'monetag';

/** سكربت الإعلان العام (يُحمَّل مرة واحدة لكل صفحة) — '' يعني لا يوجد كود بعد */
export const adHeadHtml = () => (adsEnabled() && typeof ads.headHtml === 'string' ? ads.headHtml.trim() : '');

/**
 * كود منطقة إعلانية واحدة. المفاتيح المتاحة في الإعداد:
 * movie-top · movie-bottom · top · between · bottom
 * أي منطقة بلا كود تُعيد '' ولا تُنتج أي عنصر في الصفحة (لا مربعات فارغة).
 */
export function adZoneCode(zone) {
  if (!adsEnabled() || !zone) return '';
  const code = ads.zones?.[zone];
  return typeof code === 'string' ? code.trim() : '';
}

/** هل توجد منطقة واحدة على الأقل لها كود فعلي؟ (يُستخدم للتحقق قبل البناء) */
export const adZonesWithCode = () =>
  Object.entries(ads.zones ?? {})
    .filter(([, code]) => typeof code === 'string' && code.trim() !== '')
    .map(([zone]) => zone);
