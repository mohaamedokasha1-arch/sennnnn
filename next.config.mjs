/**
 * ============================================================================
 *  إعدادات Next.js — أكاشا سينما
 * ============================================================================
 *  النشر المدعوم على Vercel هو وضع الخادم (Next.js) لصفحات المحتوى
 *  ولوحة التحكم والـAPI. خيار التصدير الثابت القديم غير مناسب لهذه المسارات
 *  الديناميكية؛ اترك AKASHA_STATIC_EXPORT=0 في الإنتاج.
 * ============================================================================
 */
const isStaticExport = process.env.AKASHA_STATIC_EXPORT === '1';

const nextConfig = {
  output: isStaticExport ? 'export' : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  // في وضع التشغيل العادي (مع لوحة التحكم) نحتاج للـAPI routes والخادم.
  // لا نستخدم export في الوضع الافتراضي كي تعمل طرق POST وملفات الـAPI.
  experimental: {
    // لضمان عمل cookies في Next.js 15
  },
};

export default nextConfig;
