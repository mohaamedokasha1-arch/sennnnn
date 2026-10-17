import { EmptyState } from './ui.jsx';

export default function PublicUnavailable({ locale = 'ar' }) {
  const en = locale === 'en';
  return (
    <div className="container mt-6" lang={en ? 'en' : 'ar'} dir={en ? 'ltr' : 'rtl'}>
      <EmptyState
        icon="🎞️"
        title={en ? 'This title is temporarily unavailable' : 'تعذّر عرض هذا العمل مؤقتًا'}
        body={en ? 'Please try again shortly, or browse the available catalog.' : 'نعرض المكتبة المحفوظة حاليًا، لكن تعذّر جلب بيانات هذا العمل. جرّب مرة أخرى بعد قليل.'}
        actions={[{ href: '/movies/', label: en ? 'Browse movies' : 'تصفّح الأفلام', primary: true }]}
      />
    </div>
  );
}
