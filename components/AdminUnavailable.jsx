import Link from 'next/link';

/** A usable response even when the admin store is missing or temporarily offline. */
export default function AdminUnavailable({ message }) {
  return (
    <div className="login-wrap">
      <div className="login-card" role="status">
        <h1>لوحة التحكم غير متاحة حاليًا</h1>
        <p>{message || 'تعذر الوصول إلى قاعدة البيانات. حاول مجددًا بعد قليل.'}</p>
        <p className="muted small">لم تتأثر صفحات الأفلام والمسلسلات؛ يمكن تصفح المحتوى المنشور كالمعتاد.</p>
        <Link className="btn btn-primary" href="/movies/">تصفّح الأفلام</Link>
      </div>
    </div>
  );
}
