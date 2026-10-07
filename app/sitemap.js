import siteConfig from '@/site.config.mjs';
import { paginationPageNumbers } from '@/lib/filter.mjs';
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
  const siteUrl = new URL(siteConfig.url);
  if (
    siteUrl.protocol !== 'https:' ||
    siteUrl.pathname !== '/' ||
    siteUrl.search ||
    siteUrl.hash ||
    siteUrl.username ||
    siteUrl.password
  ) {
    throw new Error('site.config.mjs: url must be an HTTPS origin without a path, query, fragment, or credentials.');
  }
  const origin = siteUrl.origin;
  const page = (path) => {
    if (
      typeof path !== 'string' ||
      !path.startsWith('/') ||
      path.startsWith('//') ||
      /[?#]/.test(path) ||
      path.includes(String.fromCharCode(92)) ||
      [...path].some((character) => character.charCodeAt(0) < 0x20)
    ) {
      throw new Error(`Invalid local sitemap path: ${String(path)}`);
    }
    const normalized = path.endsWith('/') ? path : `${path}/`;
    const url = new URL(normalized, `${origin}/`);
    if (url.origin !== origin || url.search || url.hash || url.username || url.password) {
      throw new Error(`Sitemap path escaped the configured site origin: ${path}`);
    }
    return { url: url.href };
  };

  const movies = getMovies();
  const series = getSeries();
  const people = getPeople().filter((person) => person.works.length > 0);
  const reviews = getReviews();
  const lists = getLists();
  const genres = genresWithContent();

  const staticPages = [
    page('/'),
    ...(movies.length
      ? [page('/movies/'), ...paginationPageNumbers(movies.length).map((number) => page(`/movies/page/${number}/`))]
      : []),
    ...(series.length
      ? [page('/series/'), ...paginationPageNumbers(series.length).map((number) => page(`/series/page/${number}/`))]
      : []),
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
