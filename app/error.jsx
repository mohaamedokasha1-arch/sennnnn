'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { IconAlert } from '@/components/Icons.jsx';

/**
 * معالجة الأخطاء: لا شاشة بيضاء ولا تفاصيل تقنية للزائر.
 * (يُفعَّل تلقائيًا من Next عند خطأ في العرض في المتصفح.)
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // ملاحظة للمطوّر: نطبع الخطأ في وحدة التحكم فقط — بلا إرسال لأي خدمة خارجية.
    console.error(error);
  }, [error]);

  return (
    <div className="container">
      <div className="empty mt-6">
        <div className="empty-icon" aria-hidden="true">
          <IconAlert width={26} height={26} />
        </div>
        <h3>حدث خطأ غير متوقع أثناء العرض</h3>
        <p>
          لا مشكلة في جهازك: هذا خطأ مؤقت في الصفحة. جرّب تحديث الصفحة، أو عُد إلى الرئيسية. لم يُرسل أي شيء عن
          هذا الخطأ إلى أي جهة خارجية.
        </p>
        <div className="empty-actions">
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            إعادة المحاولة
          </button>
          <Link href="/" className="btn btn-ghost">
            العودة للرئيسية
          </Link>
          <Link href="/search/" className="btn btn-ghost">
            البحث في الموقع
          </Link>
        </div>
      </div>
    </div>
  );
}
