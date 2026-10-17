import { GENRES, COUNTRY_LABELS, LANGUAGE_LABELS, SERIES_STATUS } from '@/lib/i18n.mjs';
import { EMBED_ALLOWED_HOSTS } from '@/lib/db.mjs';
import { withAdmin, ok } from '@/lib/api-helpers.mjs';

export const GET = withAdmin(() => {
  const genres = Object.entries(GENRES).map(([key, labels]) => ({ key, ar: labels.ar, en: labels.en }));
  const countries = Object.entries(COUNTRY_LABELS).map(([code, label]) => ({ code, label }));
  const languages = Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({ code, label }));
  const statuses = Object.entries(SERIES_STATUS).map(([key, label]) => ({ key, label }));
  return ok({ genres, countries, languages, statuses, allowedEmbedHosts: EMBED_ALLOWED_HOSTS });
});
