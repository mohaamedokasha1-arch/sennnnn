/**
 * تحويل Markdown إلى HTML — عبر مكتبة marked فقط (خفيفة، بدون خدمات خارجية).
 * المحتوى محلي ومكتوب داخل المستودع، ومع ذلك ننظّف الوسوم الخطرة كإجراء احتياطي.
 */
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

export function renderMarkdown(md = '') {
  if (!md) return '';
  let html = marked.parse(md);
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
  return html;
}

/** أزرار/قوائم عربية: استخراج مستخلص من متن */
export function textOnly(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`|-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
