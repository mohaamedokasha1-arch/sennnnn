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
