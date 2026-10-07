/**
 * ============================================================================
 *  منطق الفلترة والترتيب والترقيم — وحدة نقية تُستخدم في المتصفح وتُختبر في Node
 * ============================================================================
 *  سبب الفصل: نفس المنطق يعمل داخل مكوّن الفلاتر (client) ويُختبَر آليًا بلا متصفح،
 *  فلا تتباعد النسخ ولا يفسد السلوك بصمت. آمنة للمتصفح (لا استيراد من Node).
 * ============================================================================
 */

/** Shared listing size: links, static pagination routes and sitemap all use this value. */
export const DEFAULT_PAGE_SIZE = 24;

/** Page numbers beyond the first that have real content and need static routes. */
export function paginationPageNumbers(itemCount = 0, pageSize = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, Number(itemCount) || 0) / pageSize));
  return Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
}

/** فلترة القائمة بحسب الفلاتر المطلوبة — أي فلتر فارغ لا يُطبَّق */
export function filterWorks(items = [], f = {}) {
  const { genre = '', year = '', language = '', country = '', status = '', kind = '' } = f;
  return items.filter((w) => {
    if (kind && w.kind !== kind) return false;
    if (genre && !(w.genres ?? []).includes(genre)) return false;
    if (year && String(w.year) !== String(year)) return false;
    if (language && w.language !== language) return false;
    if (country && w.country !== country) return false;
    if (status && w.seriesStatus !== status) return false;
    return true;
  });
}

/** ترتيب: newest (أحدث إضافة) | yearDesc | yearAsc | title (أبجدي عربي) */
export function sortWorks(items = [], sort = 'newest') {
  const list = [...items];
  switch (sort) {
    case 'title':
      return list.sort((a, b) => String(a.title).localeCompare(String(b.title), 'ar'));
    case 'yearDesc':
      return list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || String(b.addedAt ?? '').localeCompare(String(a.addedAt ?? '')));
    case 'yearAsc':
      return list.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
    case 'newest':
    default:
      return list.sort(
        (a, b) => String(b.addedAt ?? '').localeCompare(String(a.addedAt ?? '')) || (b.year ?? 0) - (a.year ?? 0)
      );
  }
}

export function paginate(items = [], page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    totalPages,
    current,
    start: (current - 1) * pageSize,
    end: current * pageSize,
    slice: items.slice((current - 1) * pageSize, current * pageSize),
  };
}

/** الدالة الكاملة: فلترة ← ترتيب ← ترقيم (تُستخدم في مكوّن الفلاتر) */
export function computeResults(items = [], filters = {}, sort = 'newest', page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const filtered = sortWorks(filterWorks(items, filters), sort);
  const paged = paginate(filtered, page, pageSize);
  return { ...paged, all: filtered, count: filtered.length };
}
