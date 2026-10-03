'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { t } from '@/lib/i18n.mjs';
import { IconSearch } from './Icons.jsx';

/** نموذج البحث — يحدّث الرابط ?q= ليكون قابلًا للمشاركة، ويعمل بلا أي خدمة خارجية */
export default function SearchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');

  useEffect(() => {
    setValue(params.get('q') ?? '');
  }, [params]);

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search/?q=${encodeURIComponent(q)}` : '/search/');
  };

  return (
    <form className="search-input-wrap" onSubmit={submit} role="search" style={{ maxWidth: 560 }}>
      <span className="search-icon">
        <IconSearch width={18} height={18} />
      </span>
      <label className="sr-only" htmlFor="search-page-input">
        {t('search.label')}
      </label>
      <input
        id="search-page-input"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('search.placeholder')}
        autoComplete="off"
      />
      <button type="submit" className="search-submit">
        {t('search.submit')}
      </button>
    </form>
  );
}
