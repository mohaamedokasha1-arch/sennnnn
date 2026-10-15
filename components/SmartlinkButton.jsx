import { zoneSmartlink } from '@/lib/ads.mjs';
import { t } from '@/lib/i18n.mjs';
import { IconExternal } from './Icons.jsx';

/**
 * زر Adsterra Smartlink (مكوّن خادم — رابط عادي في HTML الثابت، بلا JavaScript).
 *
 * يظهر في صفحات الأعمال في المواضع المحددة في site.config.mjs ← ads.placements.
 * الزر يحمل دائمًا شارة «إعلان» ولا يُقدَّم كرابط مشاهدة/تحميل/سيرفر: الروابط المضلِّلة
 * تعرّض النطاق لتصنيف «موقع مخادع» في Google Safe Browsing وتخالف سياسة الموقع.
 * - rel="sponsored nofollow": إعلان مدفوع (إرشادات Google) ولا ينقل قيمة SEO.
 * - noopener بلا noreferrer: تصل الزيارة لـ Adsterra منسوبة لنطاق الموقع فتُحتسب.
 */
export default function SmartlinkButton({ zone, locale = 'ar', withNote = false }) {
  const link = zoneSmartlink(zone);
  if (!link) return null;

  const label = (locale === 'en' ? link.label.en : link.label.ar) || t('ads.smartlinkLabel', null, locale);
  const button = (
    <a
      href={link.url}
      target="_blank"
      rel="sponsored nofollow noopener"
      className="btn btn-sm smartlink-btn"
      data-ad-zone={zone}
    >
      <span>{label}</span>
      <span className="smartlink-badge">{t('ads.badge', null, locale)}</span>
      <IconExternal width={14} height={14} />
    </a>
  );

  if (!withNote) return button;
  return (
    <div className="smartlink-row">
      {button}
      <span className="smartlink-note">{t('ads.smartlinkNote', null, locale)}</span>
    </div>
  );
}
