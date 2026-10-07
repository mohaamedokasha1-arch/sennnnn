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
      {items.map((d, i) => {
        const json = JSON.stringify(d)
          .replace(/</g, '\\u003c')
          .replace(/>/g, '\\u003e')
          .replace(/&/g, '\\u0026')
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029');
        return <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
      })}
    </>
  );
}

/** بديل مؤقت صريح عند غياب البوستر أو فشل تحميله؛ لا يوحي بأنه العمل الفني الرسمي. */
export function PosterFallback({ title, year, locale = 'ar', className = '', style }) {
  const temporaryLabel = locale === 'en'
    ? 'Temporary image — not the official poster'
    : 'صورة مؤقتة — ليست البوستر الرسمي';
  const label = `${title}${year ? ` (${year})` : ''} — ${temporaryLabel}`;

  return (
    <div
      className={['poster-fallback', className].filter(Boolean).join(' ')}
      role="img"
      aria-label={label}
      style={style}
    >
      <span>
        {title}
        {year ? <small>{year}</small> : null}
        <small className="poster-fallback-status">{temporaryLabel}</small>
      </span>
    </div>
  );
}
