/**
 * أدوات تطبيع النص العربي والمطابقة — آمنة للاستخدام في المتصفح (بلا اعتماد على ملفات/خادم).
 * تُستخدم في: البحث داخل الشريط العلوي (فوري) وفي نتيجة البحث داخل الصفحات.
 */

export function normalizeAr(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // تشكيل + تطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ک/g, 'ك')
    .replace(/[’'`«»"'،؛,.:!?\-–—()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CLASSES = {
  ا: '[اأإآٱ]', أ: '[اأإآٱ]', إ: '[اأإآٱ]', آ: '[اأإآٱ]', ٱ: '[اأإآٱ]',
  ه: '[هة]', ة: '[هة]', ي: '[يىئ]', ى: '[يى]', ئ: '[ئيء]', ء: '[ءئؤ]',
  ؤ: '[ؤو]', و: '[وؤ]', ك: '[كک]',
};

export function matchRegex(query) {
  const q = String(query ?? '').trim();
  if (!q) return null;
  const body = [...q]
    .map((ch) => CLASSES[ch] ?? ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\u064B-\\u0652\\u0640]*');
  try {
    return new RegExp(body, 'giu');
  } catch {
    return null;
  }
}

/** تقسيم نص إلى أجزاء مع تعليم المطابقات (تُعرض كنص عادي داخل عناصر، بلا HTML خام) */
export function highlightParts(text = '', query = '') {
  const re = matchRegex(query);
  if (!re || !text) return [{ text, hit: false }];
  const parts = [];
  let last = 0;
  for (const m of String(text).matchAll(re)) {
    if (m.index > last) parts.push({ text: String(text).slice(last, m.index), hit: false });
    parts.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < String(text).length) parts.push({ text: String(text).slice(last), hit: false });
  return parts.filter((p) => p.text);
}

/** مقتطف حول أول تطابق */
export function snippet(text = '', query = '', len = 150) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= len) return clean;
  const re = matchRegex(query);
  const m = re ? re.exec(clean) : null;
  if (!m) return `${clean.slice(0, len - 1)}…`;
  const start = Math.max(0, m.index - Math.floor(len / 3));
  const cut = clean.slice(start, start + len).trim();
  return `${start > 0 ? '…' : ''}${cut}${start + len < clean.length ? '…' : ''}`;
}

/** مطابقة بسيطة على فهرس مُطبَّع مسبقًا (كل الكلمات يجب أن تتوفر) */
export function matchTokens(normalizedHaystack, query) {
  const tokens = normalizeAr(query).split(' ').filter(Boolean);
  if (!tokens.length) return false;
  return tokens.every((tk) => normalizedHaystack.includes(tk));
}

export function scoreItem(item, query) {
  const q = normalizeAr(query);
  const title = normalizeAr(item.title ?? '');
  const alt = normalizeAr(item.titleOriginal ?? '');
  let score = 0;
  if (title === q) score += 100;
  else if (title.startsWith(q)) score += 50;
  else if (title.includes(q)) score += 25;
  if (alt && alt.includes(q)) score += 12;
  if (item.kind === 'movie') score += 3;
  if (item.kind === 'series') score += 2.5;
  if (item.year) score += 1;
  return score;
}
