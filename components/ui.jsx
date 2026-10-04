import Link from 'next/link';
import { t } from '@/lib/i18n.mjs';
import { IconArrow, IconInfo } from './Icons.jsx';

/* ------------------------------ رأس قسم ------------------------------ */
export function SectionHeader({ kicker, title, sub, href, linkLabel, id }) {
  return (
    <div className="section-head">
      <div>
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h2 className="section-title" id={id}>
          {title}
        </h2>
        {sub ? <p className="section-sub">{sub}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="section-link">
          {linkLabel ?? t('home.browseAll')}
          <IconArrow width={16} height={16} className="flip" />
        </Link>
      ) : null}
    </div>
  );
}

/* ------------------------------ حالة فراغ ------------------------------ */
export function EmptyState({ icon = '🎬', title, body, actions = [], hint }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {hint ? <p className="small">{hint}</p> : null}
      {actions.length ? (
        <div className="empty-actions">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className={a.primary ? 'btn btn-primary' : 'btn btn-ghost'}>
              {a.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ تنبيهات ------------------------------ */
export function Notice({ children, icon = true }) {
  return (
    <div className="notice" role="note">
      {icon ? (
        <span className="notice-icon" aria-hidden="true">
          <IconInfo width={18} height={18} />
        </span>
      ) : null}
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------ مسار التنقل ------------------------------ */
export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="crumbs" aria-label="مسار التنقل">
      {items.map((it, i) => (
        <span key={`${it.url}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {i > 0 ? <span className="sep" aria-hidden="true">/</span> : null}
          {it.url && i < items.length - 1 ? <Link href={it.url}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}
        </span>
      ))}
    </nav>
  );
}

/* ------------------------------ إحصاء ------------------------------ */
export function Stat({ value, label }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
