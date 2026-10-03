import { buildIndex } from '@/lib/search.mjs';

/**
 * فهرس البحث — ملف ثابت يُولَّد وقت البناء من بيانات المحتوى.
 * يستخدمه البحث الفوري في الشريط العلوي (تحميل في المتصفح فقط، بلا أي خادم أو API).
 */
export const dynamic = 'force-static';

export function GET() {
  const index = buildIndex();
  return new Response(JSON.stringify(index), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
