import { requireAdmin } from './auth.mjs';

/** Server components can show a friendly panel instead of throwing on a DB outage. */
export async function adminPageSession() {
  try {
    return { session: await requireAdmin(), error: null };
  } catch (err) {
    console.error('Admin page unavailable:', err);
    return { session: null, error: err.statusCode === 503 ? err.message : 'تعذّر تحميل لوحة التحكم. حاول مجددًا لاحقًا.' };
  }
}

export function adminPageError(err) {
  console.error('Admin data unavailable:', err);
  return err.statusCode === 503 ? err.message : 'تعذّر تحميل البيانات. حاول مجددًا لاحقًا.';
}
