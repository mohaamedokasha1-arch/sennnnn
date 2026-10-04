/**
 * مكوّن عرض البيانات المنظمة (JSON-LD).
 * ⚠️ قاعدة صارمة: لا نُدرج أي Schema لبيانات غير موثّقة، ولا أي تقييمات مجمّعة.
 * ملاحظة: JSON.stringify آمن لأنه من بيانات نتحكم بها (ملفات المحتوى المحلية).
 */
export default function JsonLd({ data }) {
  if (!data) return null;
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
    </>
  );
}

/** بديل تصميمي أنيق عند غياب صورة البوستر — لا نعرض صورة مكسورة أبدًا */
export function PosterFallback({ title, year }) {
  return (
    <div className="poster-fallback" role="img" aria-label={`لا تتوفر صورة بوستر لـ ${title}`}>
      <span>
        {title}
        {year ? <small>{year}</small> : null}
      </span>
    </div>
  );
}
