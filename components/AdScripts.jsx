import { adOrigins, popunderLoader, socialBarLoader } from '@/lib/ads.mjs';

/**
 * ============================================================================
 *  سكربتات Adsterra العامة (مكوّنات خادم — تُكتب في HTML الثابت مباشرة)
 * ============================================================================
 *  • AdHeadScripts ← داخل <head> في التخطيط الجذري: Popunder لكل الصفحات.
 *  • AdBodyScripts ← آخر عنصر قبل </body>: Social Bar لكل الصفحات.
 *
 *  لماذا سكربت داخلي صغير بدل <script src> مباشرة؟
 *    - يُحقن سكربت Adsterra بشكل async فلا يحجب عرض الصفحة.
 *    - يعمل على نطاق الإنتاج فقط: لا نوافذ Popunder أثناء التطوير أو في معاينات Vercel،
 *      ولا مشاهدات من نطاقات غير مسجّلة في حساب Adsterra.
 *    - يُنفَّذ مرة واحدة عند فتح الموقع؛ التنقل الداخلي لا يكرره (التخطيط الجذري ثابت)،
 *      وهذا ما تطلبه Adsterra: كود Popunder/Social Bar واحد فقط في الصفحة.
 *  لا يوجد أي منطق React هنا ولا حالة، لذا لا مجال لاختلاف Hydration.
 * ============================================================================
 */
export function AdHeadScripts() {
  const loader = popunderLoader();
  return (
    <>
      {adOrigins().map((origin) => (
        <link key={origin} rel="preconnect" href={origin} />
      ))}
      {loader ? <script id="adsterra-popunder" dangerouslySetInnerHTML={{ __html: loader }} /> : null}
    </>
  );
}

export function AdBodyScripts() {
  const loader = socialBarLoader();
  return loader ? <script id="adsterra-social-bar" dangerouslySetInnerHTML={{ __html: loader }} /> : null;
}
