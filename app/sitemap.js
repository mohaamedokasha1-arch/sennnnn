import siteConfig from '@/site.config.mjs';
import { getMovies, getSeries, getPeople, getReviews, getLists, genresWithContent } from '@/lib/content.mjs';

/**
 * خريطة الموقع — تُولَّد تلقائيًا من بيانات المحتوى الفعلية وقت البناء.
 * لا تُدرج صفحات الفلاتر/البحث/المفضلة لأنها صفحات وظيفية غير مفيدة في نتائج البحث.
 */
export const dynamic = 'force-static';

export default function sitemap() {
  const base = siteConfig.url.replace(/\/$/, '');
  const now = new Date();

  const url = (path, priority = 0.6, changeFrequency = 'weekly', lastModified = now) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });

  const staticPages = [
    url('/', 1.0, 'daily'),
    url('/movies/', 0.9, 'daily'),
    url('/series/', 0.9, 'daily'),
    url('/genres/', 0.7, 'weekly'),
    url('/reviews/', 0.7, 'weekly'),
    url('/lists/', 0.6, 'weekly'),
    url('/people/', 0.5, 'monthly'),
    ...['/about/', '/contact/', '/privacy/', '/cookies/', '/terms/', '/ip-rights/'].map((p) => url(p, 0.3, 'yearly')),
  ];

  const works = [
    ...getMovies().map((w) => url(w.url, 0.8, 'monthly', w.addedAt ? new Date(w.addedAt) : now)),
    ...getSeries().map((w) => url(w.url, 0.8, 'monthly', w.addedAt ? new Date(w.addedAt) : now)),
  ];

  const genres = genresWithContent().map((g) => url(g.url, 0.6, 'weekly'));
  const reviews = getReviews().map((r) => url(r.url, 0.6, 'monthly', r.date ? new Date(r.date) : now));
  const lists = getLists().map((l) => url(l.url, 0.5, 'monthly', l.date ? new Date(l.date) : now));
  const people = getPeople()
    .filter((p) => p.works.length)
    .map((p) => url(p.url, 0.4, 'monthly'));

  return [...staticPages, ...works, ...genres, ...reviews, ...lists, ...people];
}
