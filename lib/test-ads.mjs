/**
 * ============================================================================
 *  اختبارات تكامل Adsterra — npm run test:ads
 * ============================================================================
 *  تُشغَّل في Node بلا متصفح وتغطي منطق lib/ads.mjs الفعلي المستخدم في القوالب:
 *  الأكواد، خريطة المواضع، قاعدة «كود واحد في الصفحة»، حصر الإعلانات في نطاق
 *  الإنتاج، وسلامة السكربتات المولّدة (تُنفَّذ فعليًا داخل node:vm).
 * ============================================================================
 */
import vm from 'node:vm';
import siteConfig from '../site.config.mjs';
import {
  adsEnabled,
  adsProvider,
  ZONES,
  PAGE_ZONES,
  zoneAd,
  zoneSmartlink,
  bannerUnit,
  nativeUnit,
  adHosts,
  isAdHost,
  adOrigins,
  popunderLoader,
  socialBarLoader,
  bannerDocument,
  nativeDocument,
  AD_FRAME_SANDBOX,
  adConfigIssues,
} from './ads.mjs';

let pass = 0;
let fail = 0;
const t = (name, cond, extra = '') => {
  if (cond) {
    pass += 1;
    console.log(`✅ ${name}`);
  } else {
    fail += 1;
    console.log(`❌ ${name}${extra ? `\n     ${extra}` : ''}`);
  }
};

console.log('\n🧪  اختبارات إعلانات Adsterra — أكاشا سينما\n');

/* ------------------------------ الإعداد ------------------------------ */
t('الإعلانات مفعّلة والمزوّد Adsterra', adsEnabled() && adsProvider() === 'adsterra');
const issues = adConfigIssues();
t('إعداد الإعلانات بلا أي تحذير', issues.length === 0, issues.join('\n     '));

/* ------------------------------ الأكواد ------------------------------ */
const POP = 'https://furydonkeypharmacy.com/fb/2f/89/fb2f8989e314bfcb9e43af9279bc8764.js';
const SOCIAL = 'https://furydonkeypharmacy.com/18/64/41/186441bb7f2f197f63bf73d76ddbe77f.js';
const SMART = 'https://furydonkeypharmacy.com/iqut0w8bw?key=69584a4146cb7c907413ad719c7ee13b';
const NATIVE_KEY = '23913f60849b61bc6ff17ef5713c6de1';
const BANNERS = {
  '300x250': '2484a04d5567d3f84d9597a071bebbcb',
  '468x60': 'b49a596dd1a6d4a9ffd2eaa1af1705e7',
  '728x90': 'b6c807e6e3b56e6f8395fd506b467d40',
  '320x50': 'ebc19b97ac66b83da99442380827eb43',
  '160x600': '1584a0ecd588f7264310be322045919c',
  '160x300': 'b7a4e53393e7678312b1c6354fa57454',
};

t('Popunder: الرابط مطابق للكود الرسمي', siteConfig.ads.popunder === POP);
t('Social Bar: الرابط مطابق للكود الرسمي', siteConfig.ads.socialBar === SOCIAL);
t('Smartlink: الرابط مطابق للكود الرسمي', zoneSmartlink('smartlink-watch')?.url === SMART);
const native = nativeUnit();
t(
  'Native: المفتاح والحاوية والرابط مطابقة للكود الرسمي',
  native?.key === NATIVE_KEY &&
    native.containerId === `container-${NATIVE_KEY}` &&
    native.src === `https://furydonkeypharmacy.com/${NATIVE_KEY}/invoke.js`
);
for (const [size, key] of Object.entries(BANNERS)) {
  const unit = bannerUnit(size);
  const [w, h] = size.split('x').map(Number);
  t(
    `بانر ${size}: المفتاح والمقاس ورابط invoke.js صحيحة`,
    unit?.key === key && unit.width === w && unit.height === h && unit.src === `https://www.highrevenueformat.com/${key}/invoke.js`,
    JSON.stringify(unit)
  );
}

/* ------------------------------ خريطة المواضع ------------------------------ */
const expectZone = (zone, name, devices) => {
  const ad = zoneAd(zone);
  t(`الموضع ${zone} ← ${name} (${devices})`, ad?.name === name && ad.devices === devices, JSON.stringify(ad));
};
expectZone('header', '728x90', 'tablet-up');
expectZone('rail-right', '160x600', 'wide');
expectZone('rail-left', '160x300', 'wide');
expectZone('player-top', '320x50', 'mobile');
expectZone('player-side', '300x250', 'all');
expectZone('servers-bottom', '468x60', 'tablet-up');
expectZone('movie-bottom', 'native', 'all');
expectZone('top', '320x50', 'mobile');
expectZone('between', '300x250', 'all');
expectZone('bottom', 'native', 'all');
t('الموضع footer متوقف حتى يُضاف كود 728×90 ثانٍ (لا تكرار)', zoneAd('footer') === null);
t('موضع غير معروف لا يُصدر أي شيء', zoneAd('does-not-exist') === null);
t('مواضع الأزرار لا تُعامل كوحدات عرض', zoneAd('smartlink-actions') === null);
t('أزرار Smartlink في موضعيها فقط', Boolean(zoneSmartlink('smartlink-actions')) && zoneSmartlink('header') === null);
t('كل مواضع الإعداد معروفة في القوالب', Object.keys(siteConfig.ads.placements).every((zone) => ZONES[zone]));

/* ------------------------------ كود واحد لكل صفحة ------------------------------ */
for (const [page, zones] of Object.entries(PAGE_ZONES)) {
  const keys = zones.map((zone) => zoneAd(zone)?.key).filter(Boolean);
  t(`صفحة ${page}: لا يتكرر أي كود (${keys.length} وحدات)`, new Set(keys).size === keys.length);
}
const allBannerSizes = new Set(
  Object.values(PAGE_ZONES)
    .flat()
    .map((zone) => zoneAd(zone)?.name)
    .filter((name) => name && name !== 'native')
);
t('كل البانرات الستة مستخدمة في موضع واحد على الأقل', Object.keys(BANNERS).every((size) => allBannerSizes.has(size)));

/* ------------------------------ نطاق الإنتاج فقط ------------------------------ */
const hosts = adHosts();
t('نطاق الإنتاج مسموح (مع www.)', isAdHost('akasha-cenima.vercel.app') && isAdHost('WWW.akasha-cenima.vercel.app'));
t('localhost مستبعد', !isAdHost('localhost') && !isAdHost('127.0.0.1'));
t('معاينات Vercel والنطاقات المشابهة مستبعدة', !isAdHost('sennnnn-git-main-x.vercel.app') && !isAdHost('evil-akasha-cenima.vercel.app'));
t('قائمة النطاقات تشتق من siteConfig.url', hosts.includes(new URL(siteConfig.url).hostname));
const origins = adOrigins();
t('preconnect لنطاقي الشبكة فقط', origins.includes('https://furydonkeypharmacy.com') && origins.includes('https://www.highrevenueformat.com') && origins.length === 2);

/* ------------------------------ سكربتات Popunder / Social Bar ------------------------------ */
function runLoader(code, hostname) {
  const appended = [];
  const infos = [];
  const makeParent = (name) => ({ appendChild: (el) => appended.push({ parent: name, ...el }) });
  const document = {
    head: makeParent('head'),
    body: makeParent('body'),
    documentElement: makeParent('html'),
    createElement: (tag) => ({ tag, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }),
  };
  vm.runInNewContext(code, { location: { hostname }, document, console: { info: (m) => infos.push(m) } });
  return { appended, infos };
}
const pop = runLoader(popunderLoader(), 'akasha-cenima.vercel.app');
t(
  'Popunder يُحقن async في <head> على نطاق الإنتاج',
  pop.appended.length === 1 && pop.appended[0].parent === 'head' && pop.appended[0].src === POP && pop.appended[0].async === true
);
const social = runLoader(socialBarLoader(), 'akasha-cenima.vercel.app');
t(
  'Social Bar يُحقن async في <body> على نطاق الإنتاج',
  social.appended.length === 1 && social.appended[0].parent === 'body' && social.appended[0].src === SOCIAL
);
const popDev = runLoader(popunderLoader(), 'localhost');
t('لا Popunder على localhost (ورسالة توضيحية في الكونسول)', popDev.appended.length === 0 && popDev.infos.length === 1);
const socialPreview = runLoader(socialBarLoader(), 'sennnnn-abc123.vercel.app');
t('لا Social Bar على معاينات Vercel', socialPreview.appended.length === 0);

/* ------------------------------ مستندات الإطارات ------------------------------ */
const inlineScripts = (html) => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
function runFrame(html) {
  const messages = [];
  const context = { parent: { postMessage: (data) => messages.push(data) }, window: {}, document: { body: null } };
  context.window = context;
  context.addEventListener = () => {};
  vm.createContext(context);
  for (const code of inlineScripts(html)) vm.runInContext(code, context);
  return { context, messages };
}

const banner = zoneAd('header');
const bannerHtml = bannerDocument(banner);
const bannerRun = runFrame(bannerHtml);
t(
  'البانر: atOptions الرسمي يُعرَّف كمتغير عام داخل إطاره',
  JSON.stringify(bannerRun.context.atOptions) ===
    JSON.stringify({ key: BANNERS['728x90'], format: 'iframe', height: 90, width: 728, params: {} })
);
t(
  'البانر: invoke.js بعد atOptions مع معالج حجب',
  bannerHtml.indexOf('atOptions=') < bannerHtml.indexOf(`src="https://www.highrevenueformat.com/${BANNERS['728x90']}/invoke.js"`) &&
    bannerHtml.includes(`onerror="__akashaAd('error')"`)
);
bannerRun.context.__akashaAd('error');
t('البانر: الحجب يُبلَّغ للصفحة الأم لطيّ الموضع', bannerRun.messages.some((m) => m.akashaAd === 1 && m.type === 'error'));
t('البانر: خلفية شفافة ومخطط ألوان داكن', bannerHtml.includes('background:transparent') && bannerHtml.includes('content="dark"'));

const nativeHtml = nativeDocument(zoneAd('movie-bottom'), { lang: 'en', dir: 'ltr' });
t(
  'Native: الحاوية قبل invoke.js (async + data-cfasync) واتجاه الصفحة',
  nativeHtml.indexOf(`id="container-${NATIVE_KEY}"`) < nativeHtml.indexOf('invoke.js') &&
    nativeHtml.includes('async data-cfasync="false"') &&
    nativeHtml.includes('dir="ltr"')
);
t('Native: يرسل ارتفاع المحتوى للصفحة الأم', /ResizeObserver/.test(nativeHtml) && /p\('size',h\)/.test(nativeHtml));

const hostile = bannerDocument({ key: 'a'.repeat(32), width: 1, height: 1, src: 'https://x.test/"><script>alert(1)</script>' });
t('الرابط داخل الإطار مُهرَّب (لا حقن HTML)', !hostile.includes('"><script>alert(1)'));

/* ------------------------------ عزل الإطار ------------------------------ */
const sandbox = AD_FRAME_SANDBOX.split(/\s+/);
t(
  'الإطار يسمح بالنقر وفتح صفحة المعلن في تبويب جديد',
  ['allow-scripts', 'allow-same-origin', 'allow-popups', 'allow-popups-to-escape-sandbox'].every((p) => sandbox.includes(p))
);
t(
  'الإطار يمنع تحويل صفحة الموقع إلى موقع آخر (Redirect) حتى بعد نقرة الزائر',
  !sandbox.some((p) => p.startsWith('allow-top-navigation'))
);
t(
  'الإطار يمنع نوافذ alert المزعجة والتنزيلات التلقائية',
  !sandbox.includes('allow-modals') && !sandbox.includes('allow-downloads')
);

console.log(`\n${fail ? '⛔' : '🎉'}  ${pass} ناجح · ${fail} فاشل\n`);
process.exit(fail ? 1 : 0);
