/**
 * ============================================================================
 *  طبقة الإعلانات (Adsterra) — قراءة الإعدادات من مكان مركزي واحد (site.config.mjs)
 * ============================================================================
 *  منطق نقي بلا React: تستخدمه مكوّنات الخادم والعميل، والتحقق قبل البناء، والاختبارات.
 *
 *  - zoneAd(zone)        ← ماذا يُعرض في موضع معيّن (بانر أو Native) أو null = لا شيء إطلاقًا.
 *  - zoneSmartlink(zone) ← رابط Smartlink لزر في موضع معيّن أو null.
 *  - adHosts()/isAdHost()← الإعلانات الحقيقية تعمل على نطاق الإنتاج فقط (لا مشاهدات من
 *                          localhost أو معاينات Vercel، وهي نطاقات غير مسجّلة لدى Adsterra).
 *  - bannerDocument()/nativeDocument() ← مستند iframe مستقل لكل وحدة؛ لكل بانر نافذة
 *                          خاصة به فلا يتصادم المتغير العام atOptions بين البانرات.
 *  - popunderLoader()/socialBarLoader() ← سكربت داخلي صغير يحقن Popunder/Social Bar
 *                          بشكل غير حاجب للعرض، وعلى نطاق الإنتاج فقط.
 *  - adConfigIssues()    ← تحذيرات الإعداد (تُطبع في npm run validate وتُختبر في test:ads).
 * ============================================================================
 */
import siteConfig from '../site.config.mjs';

const ads = siteConfig.ads ?? {};

/** مفاتيح Adsterra: 32 خانة ست-عشرية */
const KEY_RE = /^[a-f0-9]{32}$/i;

export const adsEnabled = () => ads.enabled === true;
export const adsProvider = () => ads.provider ?? 'adsterra';
/** خارج نطاق الإنتاج: مربعات توضيحية مكان الإعلانات (true) أو لا شيء (false) */
export const adsPreviewPlaceholders = () => ads.previewPlaceholders !== false;

export function isHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    return new URL(value.trim()).protocol === 'https:';
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------- *
 *  المواضع (Zones)
 * ------------------------------------------------------------------------- */

/**
 * كل المواضع المعروفة في القوالب.
 * devices = استهداف الأجهزة (يُطبَّق بـ CSS؛ الموضع المخفي لا يُحمِّل أي إعلان إطلاقًا):
 *   all · mobile (< 768px) · tablet-up (≥ 768px) · wide (≥ 1560px — الأعمدة الجانبية)
 */
export const ZONES = Object.freeze({
  header: { kind: 'display', devices: 'tablet-up', where: 'كل الصفحات — تحت الهيدر' },
  footer: { kind: 'display', devices: 'tablet-up', where: 'كل الصفحات — فوق الفوتر' },
  'rail-right': { kind: 'display', devices: 'wide', where: 'كل الصفحات — عمود جانبي أيمن ثابت' },
  'rail-left': { kind: 'display', devices: 'wide', where: 'كل الصفحات — عمود جانبي أيسر ثابت' },
  'player-top': { kind: 'display', devices: 'mobile', where: 'صفحات الأعمال — أعلى المشغّل' },
  'player-side': { kind: 'display', devices: 'all', where: 'صفحات الأعمال — بجانب المشغّل (وتحته على الشاشات الأصغر)' },
  'servers-bottom': { kind: 'display', devices: 'tablet-up', where: 'صفحات الأعمال — أسفل قسم روابط المشاهدة' },
  'movie-bottom': { kind: 'display', devices: 'all', where: 'صفحات الأعمال — تحت «أعمال مشابهة»' },
  'smartlink-actions': { kind: 'smartlink', where: 'صفحات الأعمال — بجانب أزرار المفضلة والمشاركة' },
  'smartlink-watch': { kind: 'smartlink', where: 'صفحات الأعمال — داخل قسم روابط المشاهدة' },
  top: { kind: 'display', devices: 'mobile', where: 'الرئيسية — أعلى المحتوى' },
  between: { kind: 'display', devices: 'all', where: 'الرئيسية — بين الأقسام' },
  bottom: { kind: 'display', devices: 'all', where: 'الرئيسية وصفحات القوائم/المراجعات/الأشخاص — أسفل المحتوى' },
});

/**
 * المواضع التي تجتمع في صفحة واحدة. قاعدة Adsterra: لا يتكرر نفس الكود في الصفحة
 * (يفسد الإحصاءات ويخفض الـ CPM) — لذلك لا يجوز أن تتكرر وحدة داخل أي مجموعة هنا.
 */
export const PAGE_ZONES = Object.freeze({
  work: ['header', 'footer', 'rail-right', 'rail-left', 'player-top', 'player-side', 'servers-bottom', 'movie-bottom'],
  home: ['header', 'footer', 'rail-right', 'rail-left', 'top', 'between', 'bottom'],
  listing: ['header', 'footer', 'rail-right', 'rail-left', 'bottom'],
});

/* ------------------------------------------------------------------------- *
 *  الوحدات (Units)
 * ------------------------------------------------------------------------- */

function bannerFromConfig(name) {
  const raw = ads.banners?.[name];
  if (!raw || typeof raw !== 'object') return null;
  const key = String(raw.key ?? '').trim();
  const width = Number(raw.width);
  const height = Number(raw.height);
  if (!KEY_RE.test(key) || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return null;
  const host = String(ads.bannerHost ?? '').trim().replace(/\/+$/, '');
  const src = String(raw.src ?? '').trim() || (host ? `${host}/${key}/invoke.js` : '');
  if (!isHttpsUrl(src)) return null;
  return { type: 'banner', name, key, width, height, src };
}

function nativeFromConfig() {
  const raw = ads.native;
  if (!raw || typeof raw !== 'object') return null;
  const key = String(raw.key ?? '').trim();
  const src = String(raw.src ?? '').trim();
  if (!KEY_RE.test(key) || !isHttpsUrl(src)) return null;
  return { type: 'native', name: 'native', key, src, containerId: `container-${key}` };
}

function smartlinkFromConfig() {
  const raw = ads.smartlink;
  const url = String((typeof raw === 'string' ? raw : raw?.url) ?? '').trim();
  if (!isHttpsUrl(url)) return null;
  const label = typeof raw === 'object' && raw?.label ? raw.label : {};
  return { url, label: { ar: String(label.ar ?? '').trim(), en: String(label.en ?? '').trim() } };
}

export const bannerUnit = (name) => (adsEnabled() ? bannerFromConfig(name) : null);
export const nativeUnit = () => (adsEnabled() ? nativeFromConfig() : null);
export const smartlink = () => (adsEnabled() ? smartlinkFromConfig() : null);

/** اسم الوحدة المسندة لموضع في site.config.mjs ← ads.placements ('' = الموضع متوقف) */
export function placementUnitName(zone) {
  const value = ads.placements?.[zone];
  return typeof value === 'string' ? value.trim() : '';
}

/** ما يُعرض في موضع إعلاني: { type: 'banner' | 'native', ... } أو null (لا يُصدر أي عنصر) */
export function zoneAd(zone) {
  if (!adsEnabled()) return null;
  const meta = ZONES[zone];
  if (!meta || meta.kind !== 'display') return null;
  const name = placementUnitName(zone);
  if (!name || name === 'smartlink') return null;
  const unit = name === 'native' ? nativeFromConfig() : bannerFromConfig(name);
  return unit ? { ...unit, zone, devices: meta.devices } : null;
}

/** رابط Smartlink لزر في موضع معيّن، أو null إن كان الموضع متوقفًا */
export function zoneSmartlink(zone) {
  if (!adsEnabled()) return null;
  if (ZONES[zone]?.kind !== 'smartlink') return null;
  if (placementUnitName(zone) !== 'smartlink') return null;
  return smartlinkFromConfig();
}

/* ------------------------------------------------------------------------- *
 *  نطاقات الإنتاج
 * ------------------------------------------------------------------------- */

function normalizeHost(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/:?#].*$/, '');
}

/** نطاقات تُعرض عليها الإعلانات الحقيقية: نطاق siteConfig.url + extraHosts (مع/بدون www.) */
export function adHosts() {
  const candidates = [];
  try {
    candidates.push(new URL(siteConfig.url).hostname);
  } catch {
    /* url غير صالح — يُلتقط في التحقق */
  }
  for (const host of Array.isArray(ads.extraHosts) ? ads.extraHosts : []) candidates.push(host);
  const hosts = new Set();
  for (const candidate of candidates) {
    const host = normalizeHost(candidate);
    if (!host) continue;
    hosts.add(host);
    hosts.add(host.startsWith('www.') ? host.slice(4) : `www.${host}`);
  }
  return [...hosts];
}

export const isAdHost = (hostname, hosts = adHosts()) =>
  typeof hostname === 'string' && hosts.includes(hostname.trim().toLowerCase());

/** أصول الشبكة الإعلانية (لـ preconnect: تسريع أول طلب إعلاني بلا أي تحميل فعلي) */
export function adOrigins() {
  if (!adsEnabled()) return [];
  const urls = [ads.popunder, ads.socialBar, nativeFromConfig()?.src];
  for (const name of new Set(Object.values(ads.placements ?? {}))) urls.push(bannerFromConfig(name)?.src);
  const origins = new Set();
  for (const url of urls) if (isHttpsUrl(url)) origins.add(new URL(url.trim()).origin);
  return [...origins];
}

/* ------------------------------------------------------------------------- *
 *  توليد الأكواد (سكربتات التحميل + مستندات الإطارات)
 * ------------------------------------------------------------------------- */

/** JSON آمن داخل وسم <script> (لا يمكن لأي قيمة إغلاق الوسم) */
const scriptJson = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const htmlAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * سكربت داخلي صغير: على نطاق الإنتاج فقط يحقن <script async src="..."> في head أو body.
 * الحقن الديناميكي غير حاجب للعرض (async) فلا يؤخر ظهور الصفحة ولا مؤشرات Core Web Vitals.
 */
export function scriptLoader(src, { target = 'head', name = 'ad' } = {}) {
  if (!isHttpsUrl(src)) return '';
  const parent = target === 'body' ? 'document.body' : 'document.head';
  return (
    `(function(){try{var h=location.hostname.toLowerCase();` +
    `if(${scriptJson(adHosts())}.indexOf(h)<0){console.info(${scriptJson(`[ads] Adsterra ${name}: production host only — skipped on `)}+h);return}` +
    `var s=document.createElement('script');s.src=${scriptJson(src.trim())};s.async=true;` +
    `s.setAttribute('data-cfasync','false');s.setAttribute('data-ad',${scriptJson(name)});` +
    `(${parent}||document.documentElement).appendChild(s)}catch(e){}})();`
  );
}

export const popunderLoader = () =>
  adsEnabled() ? scriptLoader(String(ads.popunder ?? ''), { target: 'head', name: 'popunder' }) : '';

export const socialBarLoader = () =>
  adsEnabled() ? scriptLoader(String(ads.socialBar ?? ''), { target: 'body', name: 'social-bar' }) : '';

/**
 * جسر صغير داخل الإطار: يبلغ الصفحة الأم إذا حُجب سكربت الإعلان (فيُطوى الموضع بدل
 * مستطيل فارغ)، ويرسل ارتفاع المحتوى للـ Native (ارتفاع تلقائي بلا شريط تمرير).
 */
function frameBridge({ autoHeight = false } = {}) {
  return (
    `(function(){function p(t,h){try{parent.postMessage({akashaAd:1,type:t,h:h||0},'*')}catch(e){}}window.__akashaAd=p;` +
    (autoHeight
      ? `var l=-1;function m(){var b=document.body;if(!b)return;var h=Math.ceil(b.getBoundingClientRect().height);` +
        `if(h!==l){l=h;p('size',h)}}if(window.ResizeObserver){new ResizeObserver(m).observe(document.body)}` +
        `window.addEventListener('load',m);m();`
      : '') +
    `})();`
  );
}

const FRAME_HEAD =
  '<meta charset="utf-8"><meta name="color-scheme" content="dark">' +
  '<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style>';

/** مستند iframe لبانر Adsterra — نفس الكود الرسمي حرفيًا (atOptions + invoke.js) داخل نافذة مستقلة */
export function bannerDocument(unit) {
  const options = { key: unit.key, format: 'iframe', height: unit.height, width: unit.width, params: {} };
  return (
    `<!doctype html><html><head>${FRAME_HEAD}</head><body>` +
    `<script>${frameBridge()}atOptions=${scriptJson(options)};</script>` +
    `<script src="${htmlAttr(unit.src)}" onerror="__akashaAd('error')"></script>` +
    `</body></html>`
  );
}

const NATIVE_STYLE =
  '<style>body{color:#e9eef4;font-family:"IBM Plex Sans Arabic",system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;' +
  'font-size:15px;line-height:1.55}a{color:inherit}img{max-width:100%;height:auto}</style>';

/** مستند iframe لـ Native Banner — الحاوية container-<key> + invoke.js كما في كود Adsterra */
export function nativeDocument(unit, { lang = 'ar', dir = 'rtl' } = {}) {
  return (
    `<!doctype html><html lang="${htmlAttr(lang)}" dir="${htmlAttr(dir)}"><head>${FRAME_HEAD}` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">${NATIVE_STYLE}</head><body>` +
    `<div id="${htmlAttr(unit.containerId)}"></div>` +
    `<script>${frameBridge({ autoHeight: true })}</script>` +
    `<script async data-cfasync="false" src="${htmlAttr(unit.src)}" onerror="__akashaAd('error')"></script>` +
    `</body></html>`
  );
}

/**
 * صلاحيات إطار الإعلان:
 *  ✔ السكربتات وملفات الارتباط (allow-scripts + allow-same-origin) — ليعمل كود Adsterra كما هو.
 *  ✔ النقر على الإعلان يفتح صفحة المعلن في تبويب جديد طبيعي (allow-popups + escape-sandbox).
 *  ✘ تحويل صفحة الموقع نفسها إلى موقع آخر (Redirect) — ممنوع تمامًا، حتى بعد نقرة الزائر في أي
 *    مكان بالصفحة (نشاط النقر يُشارَك مع الإطارات من نفس الأصل، لذا لا نسمح بأي تنقّل علوي).
 *  ✘ نوافذ alert/confirm المزعجة والتنزيلات التلقائية — غير مسموحة.
 */
export const AD_FRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

/* ------------------------------------------------------------------------- *
 *  التحقق من الإعداد
 * ------------------------------------------------------------------------- */

/** تحذيرات إعداد الإعلانات (لا توقف البناء) — مصفوفة فارغة = الإعداد سليم */
export function adConfigIssues() {
  if (!adsEnabled()) return [];
  const issues = [];
  const at = 'site.config.mjs ← ads';

  for (const field of ['popunder', 'socialBar']) {
    const value = String(ads[field] ?? '').trim();
    if (value && !isHttpsUrl(value)) issues.push(`${at}.${field}: يجب أن يكون رابط https كاملًا.`);
  }
  const rawSmartlink = typeof ads.smartlink === 'string' ? ads.smartlink : ads.smartlink?.url;
  if (String(rawSmartlink ?? '').trim() && !smartlinkFromConfig()) {
    issues.push(`${at}.smartlink.url: يجب أن يكون رابط https كاملًا.`);
  }
  if (ads.native && (ads.native.key || ads.native.src)) {
    const unit = nativeFromConfig();
    if (!unit) issues.push(`${at}.native: المفتاح يجب أن يكون 32 خانة ست-عشرية والرابط https.`);
    else if (!unit.src.includes(unit.key)) issues.push(`${at}.native: المفتاح لا يطابق رابط invoke.js — تأكد من نسخ الكود نفسه.`);
  }
  for (const [name, raw] of Object.entries(ads.banners ?? {})) {
    if (!raw?.key) continue; // وحدة فارغة عمدًا
    if (!bannerFromConfig(name)) issues.push(`${at}.banners['${name}']: مفتاح/مقاس/رابط غير صالح.`);
  }

  for (const [zone, unitName] of Object.entries(ads.placements ?? {})) {
    const meta = ZONES[zone];
    const name = typeof unitName === 'string' ? unitName.trim() : '';
    if (!meta) {
      issues.push(`${at}.placements['${zone}']: موضع غير معروف. المواضع المتاحة: ${Object.keys(ZONES).join('، ')}.`);
      continue;
    }
    if (!name) continue;
    if (meta.kind === 'smartlink') {
      if (name !== 'smartlink') issues.push(`${at}.placements['${zone}']: هذا موضع زر — قيمته 'smartlink' أو ''.`);
      else if (!smartlinkFromConfig()) issues.push(`${at}.placements['${zone}']: لا يوجد رابط Smartlink صالح.`);
      continue;
    }
    if (name === 'smartlink') {
      issues.push(`${at}.placements['${zone}']: الـ Smartlink رابط لأزرار وليس وحدة عرض.`);
    } else if (name === 'native' ? !nativeFromConfig() : !bannerFromConfig(name)) {
      issues.push(`${at}.placements['${zone}']: الوحدة '${name}' غير موجودة أو غير صالحة في ads.banners/ads.native.`);
    }
  }

  for (const [page, zones] of Object.entries(PAGE_ZONES)) {
    const seen = new Map();
    for (const zone of zones) {
      const name = placementUnitName(zone);
      if (!name) continue;
      const unit = name === 'native' ? nativeFromConfig() : bannerFromConfig(name);
      if (!unit) continue;
      if (seen.has(unit.key)) {
        issues.push(
          `${at}.placements: نفس الكود (${name}) في موضعين بنفس الصفحة (${page}: ${seen.get(unit.key)} و${zone}). ` +
            'Adsterra تشترط كودًا مستقلًا لكل موضع؛ سيُعرض الأول فقط ويُتخطى الثاني تلقائيًا.'
        );
      } else {
        seen.set(unit.key, zone);
      }
    }
  }

  const anything =
    popunderLoader() || socialBarLoader() || smartlinkFromConfig() || Object.keys(ZONES).some((zone) => zoneAd(zone));
  if (!anything) issues.push(`${at}: الإعلانات مفعّلة (enabled: true) لكن لا يوجد أي كود صالح.`);
  return issues;
}
