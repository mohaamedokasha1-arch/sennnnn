'use client';

import { useEffect, useRef, useState } from 'react';
import { PosterFallback } from './JsonLd.jsx';

/**
 * صورة بوستر واحدة لكل الواجهات.
 * إن غاب الملف أو فشل تحميله بعد النشر، نستبدله فورًا ببطاقة مؤقتة تحمل اسم العمل؛
 * لذلك لا تظهر أيقونة صورة مكسورة أو مساحة فارغة.
 */
export default function PosterImage({
  src,
  title,
  year,
  alt = '',
  width = 600,
  height = 900,
  loading = 'lazy',
  fetchPriority,
  decoding = 'async',
  className,
  style,
  compact = false,
  locale = 'ar',
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const imageRef = useRef(null);
  const imageSrc = typeof src === 'string' && src.trim() ? src : null;
  const failed = imageSrc && failedSrc === imageSrc;

  // Catch images that failed before React finished hydrating the static page.
  useEffect(() => {
    const image = imageRef.current;
    if (imageSrc && failedSrc !== imageSrc && image?.complete && image.naturalWidth === 0) {
      setFailedSrc(imageSrc);
    }
  }, [imageSrc, failedSrc]);

  if (!imageSrc || failed) {
    if (compact) {
      const temporaryLabel = locale === 'en'
        ? 'Temporary image — not the official poster'
        : 'صورة مؤقتة — ليست البوستر الرسمي';
      return (
        <span
          className={[className, 'suggest-thumb-fallback'].filter(Boolean).join(' ')}
          role="img"
          aria-label={`${title}${year ? ` (${year})` : ''} — ${temporaryLabel}`}
        >
          {locale === 'en' ? 'Temp.' : 'مؤقتة'}
        </span>
      );
    }

    return (
      <PosterFallback
        title={title}
        year={year}
        locale={locale}
        className={className}
        style={style ? { ...style, aspectRatio: '2 / 3' } : undefined}
      />
    );
  }

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      {...(fetchPriority ? { fetchPriority } : {})}
      decoding={decoding}
      className={className}
      style={style}
      onError={() => setFailedSrc(imageSrc)}
    />
  );
}
