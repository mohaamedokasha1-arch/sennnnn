'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/i18n.mjs';
import {
  zoneAd,
  isAdHost,
  adsPreviewPlaceholders,
  bannerDocument,
  nativeDocument,
  AD_FRAME_SANDBOX,
} from '@/lib/ads.mjs';

/**
 * ============================================================================
 *  مواضع إعلانات Adsterra (بانرات + Native) — نقطة التكامل الوحيدة في القوالب
 * ============================================================================
 *  • الأكواد لا توجد هنا: كل شيء يُقرأ من site.config.mjs ← ads (عبر lib/ads.mjs).
 *  • بلا مشكلات Hydration: الخادم والعميل يرسمان نفس الحاوية الفارغة بمقاس محجوز
 *    (فلا تقفز الصفحة CLS)، وكل ما يعتمد على المتصفح (النطاق، الظهور، الإطار) يحدث
 *    بعد التركيب داخل useEffect فقط.
 *  • لكل وحدة iframe مستقل (srcdoc): المتغير العام atOptions لا يتصادم بين البانرات،
 *    وكود Adsterra يعمل حرفيًا كما هو. ويُرسل المتصفح رابط الصفحة نفسها كـ Referrer.
 *  • تحميل كسول: الإطار لا يُنشأ إلا عند اقتراب الموضع من الشاشة. الموضع المخفي بـ CSS
 *    (استهداف الأجهزة) لا يقترب أبدًا، فلا يُحمَّل أي إعلان مخفي (لا مشاهدات غير صالحة).
 *  • قاعدة Adsterra «كود واحد في الصفحة»: لو تكرر نفس المفتاح في موضعين معروضين
 *    يُعرض الأول فقط.
 *  • حجب الإعلان (AdBlock/شبكة): يُطوى الموضع بالكامل بدل مستطيل فارغ.
 *  • خارج نطاق الإنتاج (localhost/معاينات): مربع توضيحي فقط، بلا أي طلب لـ Adsterra.
 * ============================================================================
 */

/** المفاتيح المعروضة حاليًا في الصفحة: key → المالك (قاعدة كود واحد لكل صفحة) */
const liveKeys = new Map();
const claimKey = (key, owner) => {
  const current = liveKeys.get(key);
  if (current && current !== owner) return false;
  liveKeys.set(key, owner);
  return true;
};
const releaseKey = (key, owner) => {
  if (liveKeys.get(key) === owner) liveKeys.delete(key);
};

/** يبدأ التحميل قبل وصول الموضع للشاشة بمسافة كافية ليظهر الإعلان جاهزًا */
const LAZY_MARGIN = '400px 0px';

const localeFromPath = (pathname) => (pathname === '/en' || pathname?.startsWith('/en/') ? 'en' : 'ar');

/**
 * موضع إعلاني واحد داخل قالب.
 * @param {string}  zone    اسم الموضع (انظر ZONES في lib/ads.mjs و placements في site.config.mjs)
 * @param {boolean} hidden  إخفاء الموضع في الصفحات قليلة المحتوى (قرار الصفحة نفسها)
 * @param {string}  locale  'ar' | 'en' (افتراضيًا من بادئة الرابط)
 */
export function AdSlot({ zone, hidden = false, locale, className = '' }) {
  const pathname = usePathname();
  const ad = hidden ? null : zoneAd(zone);
  if (!ad) return null; // لا كود = لا عنصر إطلاقًا في الصفحة
  return <AdFrame ad={ad} lang={locale ?? localeFromPath(pathname)} className={className} />;
}

/**
 * موضع على مستوى التخطيط (الهيدر/الأعمدة الجانبية/الفوتر): يبقى ثابتًا أثناء التنقل
 * داخل الموقع، لذا يُعاد إنشاؤه مع كل صفحة جديدة — مشاهدة جديدة لكل صفحة كما في أي موقع عادي.
 */
export function RouteAdSlot(props) {
  const pathname = usePathname() ?? '/';
  return <AdSlot key={`${props.zone}:${pathname}`} {...props} />;
}

function AdFrame({ ad, lang, className }) {
  const isNative = ad.type === 'native';
  const boxRef = useRef(null);
  const frameRef = useRef(null);
  // idle → live | preview | off | duplicate | blocked — القيمة الأولى متطابقة بين الخادم والعميل
  const [state, setState] = useState('idle');
  const [nativeHeight, setNativeHeight] = useState(1);
  const [filled, setFilled] = useState(!isNative);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;

    if (!isAdHost(window.location.hostname)) {
      setState(adsPreviewPlaceholders() ? 'preview' : 'off');
      return undefined;
    }

    let alive = true;
    let claimed = false;
    let observer = null;
    const owner = {};

    // رسائل الإطار تُستقبل من لحظة التركيب (قبل إنشاء الإطار) فلا تضيع أي رسالة مبكرة
    const onMessage = (event) => {
      const frame = frameRef.current;
      if (!alive || !frame || event.source !== frame.contentWindow) return;
      const data = event.data;
      if (!data || data.akashaAd !== 1) return;
      if (data.type === 'error') {
        setState('blocked');
      } else if (data.type === 'size' && isNative) {
        const height = Math.max(0, Math.min(4000, Math.ceil(Number(data.h) || 0)));
        setNativeHeight(height > 0 ? height : 1);
        setFilled(height > 0);
      }
    };
    window.addEventListener('message', onMessage);

    const goLive = () => {
      if (!alive || claimed) return;
      observer?.disconnect();
      if (!claimKey(ad.key, owner)) {
        setState('duplicate');
        return;
      }
      claimed = true;
      setState('live');
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && goLive(), {
        rootMargin: LAZY_MARGIN,
      });
      observer.observe(box);
    } else if (box.getClientRects().length) {
      goLive();
    }

    return () => {
      alive = false;
      observer?.disconnect();
      window.removeEventListener('message', onMessage);
      if (claimed) releaseKey(ad.key, owner);
    };
  }, [ad.key, isNative]);

  const srcDoc = useMemo(() => {
    if (state !== 'live') return null;
    return isNative ? nativeDocument(ad, { lang, dir: lang === 'en' ? 'ltr' : 'rtl' }) : bannerDocument(ad);
  }, [state, isNative, ad, lang]);

  const label = t('ads.label', null, lang);
  const classes = ['ad-slot', `ad-slot--${ad.zone}`, `ad-dev-${ad.devices}`, isNative ? 'ad-slot--native' : '', className]
    .filter(Boolean)
    .join(' ');
  const sizeVars = isNative ? undefined : { '--ad-w': `${ad.width}px`, '--ad-h': `${ad.height}px` };

  return (
    <div
      className={classes}
      style={sizeVars}
      data-ad-zone={ad.zone}
      data-ad-unit={ad.name}
      data-ad-state={state}
      data-ad-filled={filled ? 'true' : 'false'}
    >
      <span className="ad-slot__label">{label}</span>
      <div className="ad-slot__box" ref={boxRef}>
        {state === 'live' ? (
          <iframe
            ref={frameRef}
            title={label}
            srcDoc={srcDoc}
            width={isNative ? '100%' : ad.width}
            height={isNative ? nativeHeight : ad.height}
            style={isNative ? { height: nativeHeight } : undefined}
            scrolling="no"
            sandbox={AD_FRAME_SANDBOX}
          />
        ) : null}
        {state === 'preview' ? (
          <span className="ad-slot__preview" dir="ltr">
            Adsterra · {isNative ? 'Native Banner' : `${ad.width}×${ad.height}`} · {ad.zone}
          </span>
        ) : null}
      </div>
    </div>
  );
}
