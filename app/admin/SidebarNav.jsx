'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import LogoutButton from './LogoutButton.jsx';

export default function SidebarNav({ user }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const item = (href, label) => {
    const active = mounted ? pathname === href || (href !== '/admin' && pathname.startsWith(href)) : pathname === href;
    return (
      <Link
        href={href}
        className={active ? 'active' : ''}
        onClick={(e) => { /* allow default */ }}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside className="admin-sidebar">
      <div style={{ padding: '8px 14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>لوحة التحكم</div>
        <div className="muted small" style={{ marginTop: 4 }}>أكاشا سينما</div>
      </div>
      <nav style={{ marginTop: 14 }}>
        {item('/admin', 'نظرة عامة')}
        <h2>المحتوى</h2>
        {item('/admin/movies', 'الأفلام')}
        {item('/admin/series', 'المسلسلات')}
        <h2>النظام</h2>
        {item('/admin/settings', 'إعدادات الموقع')}
        {item('/admin/password', 'كلمة المرور')}
        <Link href="/">العودة للموقع ←</Link>
        <div style={{ padding: '14px', marginTop: 18, borderTop: '1px solid var(--border)' }}>
          <div className="muted small" style={{ marginBottom: 8 }}>مسجّل كـ:</div>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div className="muted small">{user.username}</div>
          <div style={{ marginTop: 10 }}>
            <LogoutButton />
          </div>
        </div>
      </nav>
    </aside>
  );
}
