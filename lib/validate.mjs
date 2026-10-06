/**
 * ============================================================================
 *  سكربت التحقق من بيانات المحتوى — npm run validate
 * ============================================================================
 *  يُشغَّل تلقائيًا قبل كل بناء (prebuild)، وأي خطأ يمنع النشر.
 *  يتحقق من: الحقول الإلزامية، تكرار المعرّفات، صحة الأنواع والتصنيفات،
 *  وجود ملفات الصور محليًا، سلامة الروابط الداخلية، ونطاقات المشاهدة الرسمية.
 * ============================================================================
 */
import { loadRaw } from './content.mjs';
import { adZonesWithCode, adHeadHtml } from './ads.mjs';
import siteConfig from '../site.config.mjs';

const G = (s) => `\x1b[32m${s}\x1b[0m`;
const R = (s) => `\x1b[31m${s}\x1b[0m`;
const Y = (s) => `\x1b[33m${s}\x1b[0m`;
const B = (s) => `\x1b[1m${s}\x1b[0m`;

const { movies, series, people, reviews, lists, errors, warnings } = loadRaw();

// إحصاءات تُحسب من القراءة الخام (لا تتوقف عند وجود أخطاء، حتى نعرض التقرير كاملًا)
const published = [...movies, ...series].filter((w) => !w.draft);
console.log(B('\n🎬  أكاشا سينما — التحقق من بيانات المحتوى'));
console.log('─'.repeat(58));
console.log(`  أفلام: ${movies.length}   |   مسلسلات: ${series.length}   |   أشخاص: ${people.length}`);
console.log(`  مراجعات: ${reviews.length}   |   قوائم ترشيحات: ${lists.length}`);
console.log('─'.repeat(58));

// تحذيرات إعداد عام (لا توقف البناء)
const configWarnings = [];
if (/example\.com/.test(siteConfig.url)) {
  configWarnings.push('site.config.mjs ← url: لا يزال نطاقًا تجريبيًا (example.com). بدّله بالنطاق الحقيقي قبل الإطلاق ليعمل Sitemap وCanonical بشكل صحيح.');
}
if (siteConfig.contact.email.includes('example.com') || siteConfig.contact.copyrightEmail.includes('example.com')) {
  configWarnings.push('site.config.mjs ← contact: بريد التواصل تجريبي. بدّله ببريدك الحقيقي قبل الإطلاق.');
}
if (siteConfig.ads?.enabled && adZonesWithCode().length === 0 && !adHeadHtml()) {
  configWarnings.push('site.config.mjs ← ads: الإعلانات مفعّلة (enabled: true) لكن لا يوجد أي كود Monetag. أضف الكود أو أعِد enabled إلى false.');
}
const placeholderWatch = [...movies, ...series].flatMap((w) => w.watch).filter((x) => /example-/.test(x.url));
if (placeholderWatch.length) {
  configWarnings.push(`يوجد ${placeholderWatch.length} رابط مشاهدة على نطاق توضيحي (example-*). استبدلها بروابط رسمية حقيقية أو احذفها.`);
}

const allWarnings = [...configWarnings, ...warnings];

if (allWarnings.length) {
  console.log(Y(`\n⚠️  تحذيرات (${allWarnings.length}) — لا توقف البناء:`));
  allWarnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
}

if (errors.length) {
  console.log(R(`\n⛔ أخطاء (${errors.length}) — يجب إصلاحها قبل البناء:`));
  errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
  console.log(R('\nفشل التحقق. أصلح الأخطاء أعلاه ثم أعد المحاولة.\n'));
  process.exit(1);
}

console.log(G('\n✅ كل بيانات المحتوى سليمة — البناء آمن.\n'));
