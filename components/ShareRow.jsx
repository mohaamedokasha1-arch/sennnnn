'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n.mjs';
import { IconLink, IconShare } from './Icons.jsx';

/**
 * مشاركة الصفحة: نسخ الرابط + روابط مباشرة (X وواتساب).
 * كل شيء يعمل في المتصفح عبر الرابط الحالي — بلا خدمة مشاركة خارجية ولا تتبّع.
 */
export default function ShareRow({ title }) {
  const [copied, setCopied] = useState(false);

  const currentUrl = () => (typeof window !== 'undefined' ? window.location.href : '');

  const copy = async () => {
    const url = currentUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // بديل عند رفض الإذن: نعرض الرابط للمستخدم ليختاره يدويًا
      window.prompt(t('work.shareCopy'), url);
    }
  };

  const share = (network) => {
    const url = encodeURIComponent(currentUrl());
    const text = encodeURIComponent(`${title} — ${t('work.share')}`);
    if (network === 'x') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener');
    if (network === 'whatsapp') window.open(`https://wa.me/?text=${text}%20${url}`, '_blank', 'noopener');
  };

  return (
    <div className="share-row">
      <span className="share-note">
        <IconShare width={16} height={16} className="flip" style={{ display: 'inline-block', verticalAlign: '-3px' }} />{' '}
        {t('work.share')}:
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={copy} aria-live="polite">
        <IconLink width={15} height={15} />
        {copied ? t('work.shareCopied') : t('work.shareCopy')}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => share('x')}>
        {t('work.shareX')}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => share('whatsapp')}>
        {t('work.shareWhatsapp')}
      </button>
    </div>
  );
}
