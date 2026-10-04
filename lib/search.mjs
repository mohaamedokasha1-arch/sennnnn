/**
 * ============================================================================
 *  البحث الداخلي — يعمل بالكامل على بيانات الموقع المحلية (بدون أي خدمة خارجية)
 * ============================================================================
 *  - بحث جزئي بالعربية أو بالاسم الأصلي.
 *  - توحيد الحروف العربية (أ/إ/آ → ا، ة → ه، ى → ي) وتجاهل التشكيل والتطويل.
 *  - يُستخدم في: صفحة البحث (عبر رابط ?q=) وقائمة البحث الفورية في الشريط العلوي
 *    (عبر ملف ثابت /search-index.json لا يحتاج أي خادم).
 * ============================================================================
 */
import { getWorks, getReviews, getLists, getPeople, excerpt } from './content.mjs';
import { genreLabel, typeLabel, workUrl } from './i18n.mjs';
import { normalizeAr } from './highlight.mjs';

export { normalizeAr, matchRegex, highlightParts, snippet, matchTokens, scoreItem } from './highlight.mjs';

/** فهرس البحث الكامل — يُبنى وقت البناء ويُصدَّر كملف ثابت */
export function buildIndex() {
  const works = getWorks('all').map((w) => {
    const peopleList = getPeople();
    const personNames = (ids = []) =>
      ids
        .map((id) => {
          const p = peopleList.find((x) => x.id === id);
          return p ? [p.name, p.nameOriginal].filter(Boolean).join(' ') : id;
        })
        .join(' ');
    const directors = personNames(w.directors);
    const writers = personNames(w.writers);
    const cast = personNames(w.cast);
    return {
      id: `${w.kind}:${w.slug}`,
      kind: w.kind,
      typeLabel: typeLabel(w.kind),
      url: w.url,
      title: w.title,
      titleOriginal: w.titleOriginal,
      year: w.year,
      genres: w.genres.map(genreLabel),
      synopsis: w.synopsis,
      poster: w.hasPoster ? w.poster : null,
      search: normalizeAr(
        [w.title, w.titleOriginal, w.year, w.genres.map(genreLabel).join(' '), directors, writers, cast].join(' ')
      ),
    };
  });

  const reviews = getReviews().map((r) => ({
    id: `review:${r.slug}`,
    kind: 'review',
    typeLabel: 'مراجعة',
    url: r.url,
    title: r.title,
    workTitle: r.work?.title ?? '',
    author: r.author,
    date: r.date,
    excerpt: r.excerpt,
    search: normalizeAr([r.title, r.work?.title, r.author, r.verdict].join(' ')),
  }));

  const lists = getLists().map((l) => ({
    id: `list:${l.slug}`,
    kind: 'list',
    typeLabel: 'ترشيحات',
    url: l.url,
    title: l.title,
    description: l.description,
    count: l.items.length,
    search: normalizeAr([l.title, l.description, l.items.map((i) => i.work?.title).join(' ')].join(' ')),
  }));

  const people = getPeople()
    .filter((p) => p.works.length)
    .map((p) => ({
      id: `person:${p.id}`,
      kind: 'person',
      typeLabel: p.roleLabel,
      url: p.url,
      title: p.name,
      worksCount: p.works.length,
      search: normalizeAr([p.name, p.nameOriginal, p.roleLabel, p.works.map((w) => w.title).join(' ')].join(' ')),
    }));

  return { works, reviews, lists, people };
}

/** بحث واحد على الفهرس: كل كلمات الاستعلام يجب أن تتوفر (AND) */
export function runSearch(query, index = null) {
  const q = normalizeAr(query);
  const idx = index ?? buildIndex();
  if (!q) return { works: [], reviews: [], lists: [], people: [], total: 0 };
  const tokens = q.split(' ').filter(Boolean);
  const match = (item) => tokens.every((tk) => item.search.includes(tk));

  const rank = (item, isMain) => {
    const title = normalizeAr(isMain ? item.title : item.title);
    let score = 0;
    if (title === q) score += 100;
    if (title.startsWith(q)) score += 50;
    if (title.includes(q)) score += 25;
    if (item.year) score += 1;
    return score;
  };

  const works = idx.works.filter(match).sort((a, b) => rank(b, true) - rank(a, true) || b.year - a.year);
  const reviews = idx.reviews.filter(match).sort((a, b) => rank(b) - rank(a));
  const lists = idx.lists.filter(match).sort((a, b) => rank(b) - rank(a));
  const people = idx.people.filter(match).sort((a, b) => rank(b) - rank(a));

  return { works, reviews, lists, people, total: works.length + reviews.length + lists.length + people.length };
}

export { workUrl };
