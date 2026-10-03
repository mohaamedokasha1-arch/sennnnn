'use client';

import { useState } from 'react';
import siteConfig from '@/site.config.mjs';
import { t } from '@/lib/i18n.mjs';

/**
 * نموذج تواصل بدون خادم:
 * يفتح برنامج البريد الافتراضي مع موضوع ونص جاهزين (mailto) — لا إرسال لأي جهة خارجية،
 * ولا تخزين لأي بيانات، ولا حاجة لقاعدة بيانات أو خدمة نماذج.
 */
export default function ContactForm() {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('استفسار عام');
  const [message, setMessage] = useState('');

  const openMail = (e) => {
    e.preventDefault();
    const subject = `[${siteConfig.siteName}] ${topic}${name ? ` — ${name}` : ''}`;
    const body = `${message}\n\n—\n${name ? `الاسم: ${name}\n` : ''}أُرسلت من صفحة اتصل بنا في ${siteConfig.siteName}`;
    window.location.href = `mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form className="panel stack" onSubmit={openMail} aria-labelledby="contact-form-title">
      <h2 className="panel-title" id="contact-form-title">
        أرسل رسالة
      </h2>

      <div className="field">
        <label htmlFor="c-name">الاسم (اختياري)</label>
        <input
          id="c-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 10px', color: 'var(--text)', fontFamily: 'inherit' }}
        />
      </div>

      <div className="field">
        <label htmlFor="c-topic">موضوع الرسالة</label>
        <select id="c-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option>استفسار عام</option>
          <option>اقتراح إضافة عمل</option>
          <option>تصحيح معلومة</option>
          <option>طلب حقوق ملكية / إزالة محتوى</option>
          <option>مسألة تقنية</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="c-message">نص الرسالة (مطلوب)</label>
        <textarea
          id="c-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        فتح برنامج البريد وإرسال الرسالة
      </button>

      <p className="panel-note" style={{ marginBottom: 0 }}>
        لا يتم إرسال أي شيء إلى خوادمنا: النموذج يجهّز الرسالة في بريدك فقط. البريد المستهدف:{' '}
        <span dir="ltr">{siteConfig.contact.email}</span>
      </p>
    </form>
  );
}
