import siteConfig from '@/site.config.mjs';
import {
  getMovies,
  getSeries,
  getPeople,
  getReviews,
  getLists,
  genresWithContent,
} from '@/lib/content.mjs';

/**
 * Sitemap built only from published content and indexable collection pages.
 * No lastmod is emitted because this project has no trustworthy per-page modified date.
 */
export const dynamic = 'force-static';

export default function sitemap() {
  const base = siteConfig.url.replace(/\/$/, '');
  const page = (path) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return { url: `${base}${normalized.endsWith('/') ? normalized : `${normalized}/`}` };
  };

  const movies = getMovies();
  const series = getSeries();
  const people = getPeople().filter((person) => person.works.length > 0);
  const reviews = getReviews();
  const lists = getLists();
  const genres = genresWithContent();

  const staticPages = [
    page('/'),
    ...(movies.length ? [page('/movies/')] : []),
    ...(series.length ? [page('/series/')] : []),
    ...(genres.length ? [page('/genres/')] : []),
    ...(people.length ? [page('/people/')] : []),
    ...(reviews.length ? [page('/reviews/')] : []),
    ...(lists.length ? [page('/lists/')] : []),
    ...['/about/', '/contact/', '/privacy/', '/cookies/', '/terms/', '/ip-rights/'].map(page),
  ];

  const contentPages = [
    ...movies.map((work) => page(work.url)),
    // English pages are listed only when an explicit English synopsis exists.
    ...movies.filter((work) => work.synopsisEn).map((work) => page(`/en${work.url}`)),
    ...series.map((work) => page(work.url)),
    ...genres.map((genre) => page(genre.url)),
    ...reviews.map((review) => page(review.url)),
    ...lists.map((list) => page(list.url)),
    ...people.map((person) => page(person.url)),
  ];

  // Guard against accidental duplicate URLs if a custom legacy path collides with another record.
  return [...new Map([...staticPages, ...contentPages].map((entry) => [entry.url, entry])).values()];
}
