/**
 * خطافات تحميل وحدات ESM للاختبارات فقط: تعترض استيراد 'pg' وتوجّهه إلى
 * محاكي مبني على PGlite (PostgreSQL حقيقي داخل WASM) حتى تُختبر تعليمات
 * SQL الفعلية (مزامنة السكيما، الأقفال الاستشارية، CAS) دون خادم خارجي.
 * التسجيل يتم من ملف الاختبار عبر node:module register() قبل استيراد طبقة التخزين.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'pg') {
    return { url: new URL('./pg-mock.mjs', import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
