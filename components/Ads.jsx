'use client';

import { useEffect, useRef } from 'react';
import { adHeadHtml, adZoneCode } from '@/lib/ads.mjs';

/**
 * ============================================================================
 *  مكوّنات الإعلانات — نقطة التكامل الوحيدة مع Monetag
 * ============================================================================
 *  • الكود لا يوجد هنا: كل شيء يُقرأ من site.config.mjs (ads.headHtml و ads.zones).
 *  • يُعرض المكوّن في القوالب مرة واحدة فقط لكل موضع، فيظهر الإعلان تلقائيًا في
 *    كل الصفحات التي تستخدم القالب (بما فيها صفحات الأفلام الجديدة لاحقًا).
 *  • حماية من التكرار: لو تكرّر نفس الموضع في الصفحة بالخطأ، يُنفَّذ الكود مرة واحدة.
 *  • بدون كود مُعرَّف: لا يُصدر المكوّن أي عنصر في الصفحة (لا مكان فارغ ولا مربع).
 * ============================================================================
 */

/** يحوّل نص الكود (HTML/JS) إلى عناصر قابلة للتنفيذ: وسوم <script> تُعاد إنشاؤها لتُشغَّل */
function buildNodes(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const nodes = [];
  tpl.content.childNodes.forEach((node) => {
    if (node.tagName === 'SCRIPT') {
      const s = document.createElement('script');
      for (const { name, value } of Array.from(node.attributes)) s.setAttribute(name, value);
      s.text = node.textContent ?? '';
      nodes.push(s);
    } else {
      nodes.push(node);
    }
  });
  return nodes;
}

/**
 * سكربت Monetag العام — يُحمَّل مرة واحدة فقط في الصفحة مهما تنقّل الزائر.
 * يُوضع داخل app/layout.jsx، ولا يحتاج أي تعديل في الصفحات.
 */
export function AdHead() {
  const html = adHeadHtml();

  useEffect(() => {
    if (!html) return;
    if (document.querySelector('script[data-ad="head"]')) return; // محمَّل مسبقًا — لا تكرار
    const nodes = buildNodes(html);
    nodes.forEach((n) => n.setAttribute?.('data-ad', 'head'));
    nodes.forEach((n) => document.head.appendChild(n));
  }, [html]);

  return null;
}

/**
 * مساحة إعلانية واحدة داخل قالب صفحة.
 * @param {string} zone  مفتاح الموضع في site.config.mjs ← ads.zones (مثل movie-top)
 * @param {boolean} hidden  إخفاء الموضع في صفحات قليلة المحتوى (قرار الصفحة نفسها)
 */
export function AdSlot({ zone, hidden = false, className = '' }) {
  const code = adZoneCode(zone);
  const holder = useRef(null);

  useEffect(() => {
    if (!code || hidden || !holder.current) return;
    const el = holder.current;
    if (el.dataset.adFilled === '1') return;

    // لو تكرّر نفس الموضع في الصفحة (خطأً)، نُبقي نسخة واحدة فقط
    const sameZone = document.querySelectorAll(`[data-ad-zone="${zone}"]`);
    if (sameZone.length > 1 && sameZone[0] !== el) {
      el.dataset.adFilled = 'skip';
      return;
    }

    el.dataset.adFilled = '1';
    buildNodes(code).forEach((n) => el.appendChild(n));
  }, [code, hidden, zone]);

  if (!code || hidden) return null; // لا كود = لا عنصر إطلاقًا في الصفحة
  return <div ref={holder} className={`ad-zone${className ? ` ${className}` : ''}`} data-ad-zone={zone} />;
}
