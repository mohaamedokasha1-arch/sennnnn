'use client';

import { useEffect } from 'react';

/**
 * يضبط لغتَي/اتجاه جذر المستند (html) لصفحات لغة غير العربية.
 * السبب: التخطيط الجذري في المشروع عربي (lang="ar" dir="rtl")، وصفحات /en/ تُعرض
 * داخل حاوية (dir="ltr" lang="en") صحيحة، لكن وسم <html> نفسه يبقى عربيًا.
 * هذا المكوّن لا يُنتج أي عنصر في الصفحة ولا يغيّر أي تصميم — يحدّث سمتين فقط
 * عند التحميل، ثم يعيدهما كما كانا عند مغادرة الصفحة.
 */
export default function DocumentLang({ lang, dir }) {
  useEffect(() => {
    const root = document.documentElement;
    const previousLang = root.getAttribute('lang');
    const previousDir = root.getAttribute('dir');
    if (lang) root.setAttribute('lang', lang);
    if (dir) root.setAttribute('dir', dir);
    return () => {
      if (previousLang) root.setAttribute('lang', previousLang);
      if (previousDir) root.setAttribute('dir', previousDir);
    };
  }, [lang, dir]);

  return null;
}
