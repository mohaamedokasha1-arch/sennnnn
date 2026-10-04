/**
 * أدوات تنسيق العرض: التواريخ، المدد، زمن القراءة.
 * نستخدم أرقامًا لاتينية مع أسماء الشهور العربية (أوضح للقارئ العربي وأكثر اتساقًا).
 */

const AR_DATE = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
const EN_DATE = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
const AR_MONTH = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { month: 'long', year: 'numeric' });

export function formatDate(iso, locale = 'ar') {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return locale === 'en' ? EN_DATE.format(d) : AR_DATE.format(d);
}

export function formatMonthYear(iso) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return AR_MONTH.format(d);
}

export function formatRuntime(minutes, locale = 'ar') {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale === 'en') {
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }
  if (h && m) return `${h} س ${m} د`;
  if (h) return `${h} س`;
  return `${m} د`;
}

export function readingTime(text = '') {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
