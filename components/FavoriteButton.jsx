'use client';

import { useEffect, useState } from 'react';
import { t } from '@/lib/i18n.mjs';
import { IconHeart } from './Icons.jsx';

/**
 * ============================================================================
 *  المفضلة — تخزين محلي في متصفح الزائر فقط (localStorage)
 * ============================================================================
 *  لا حساب مستخدم، ولا إرسال أي بيانات لأي خادم، ولا خدمة خارجية.
 *  ملاحظة تُعرض للزائر في صفحة المفضلة: القائمة تبقى على هذا الجهاز فقط.
 * ============================================================================
 */
export const FAV_KEY = 'cinemana:favorites';
export const FAV_EVENT = 'cinemana:favorites-changed';

export function readFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function writeFavorites(ids) {
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify([...new Set(ids)]));
    window.dispatchEvent(new Event(FAV_EVENT));
  } catch {
    /* قد يكون التخزين المحلي معطّلًا في المتصفح — نتجاهل بهدوء ولا نعرض خطأ للمستخدم */
  }
}

export default function FavoriteButton({ id, title, variant = 'card' }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => setOn(readFavorites().includes(id));
    sync();
    window.addEventListener(FAV_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(FAV_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [id]);

  const toggle = () => {
    const current = readFavorites();
    writeFavorites(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    setOn(!on);
  };

  const label = on ? `${t('work.favoriteRemove')}: ${title}` : `${t('work.favoriteAdd')}: ${title}`;

  if (variant === 'inline') {
    return (
      <button type="button" className="btn btn-ghost" aria-pressed={on} onClick={toggle} title={t('work.favoriteAdd')}>
        <IconHeart filled={on} />
        {on ? t('work.favoriteRemove') : t('work.favoriteAdd')}
      </button>
    );
  }

  return (
    <button type="button" className="icon-btn" aria-pressed={on} onClick={toggle} aria-label={label} title={label}>
      <IconHeart filled={on} />
    </button>
  );
}
