import { t } from '@/lib/i18n.mjs';

/**
 * مشغّل التريلر الرسمي (اختياري — لا يُعرض إلا إذا وُجد رابط رسمي مسموح بتضمينه).
 *
 * الضوابط القانونية والتقنية المُطبَّقة:
 *   1) التضمين يدعم مزوّدين رسميين فقط: YouTube أو Vimeo (تحقق مسبق في lib/content.mjs).
 *   2) نستخدم نطاق youtube-nocookie.com لتقليل التتبّع قبل التشغيل.
 *   3) تحميل كسول: الإطار يُحمَّل عند التمرير إليه (loading="lazy").
 *   4) لا يُضمَّن إلا مقطع من القناة الناشرة نفسها، وبمسؤولية محرر المحتوى:
 *      أي مقطع غير رسمي = مخالفة لسياسة الموقع (لا نستضيف ولا نعيد نشر أي مقطع).
 */
const SRC = {
  youtube: (id) => `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&hl=ar`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}`,
};

export default function TrailerEmbed({ trailer, title }) {
  if (!trailer?.provider || !trailer?.id) return null;
  const src = SRC[trailer.provider]?.(trailer.id);
  if (!src) return null;

  return (
    <section className="panel" aria-labelledby="trailer-title">
      <h2 className="panel-title" id="trailer-title">
        {t('work.trailer')}
      </h2>
      <div className="trailer-frame">
        <iframe
          src={src}
          title={`${t('work.trailer')}: ${title}`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <p className="panel-note mt-2">{t('work.trailerNote')}</p>
    </section>
  );
}
