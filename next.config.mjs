/**
 * ============================================================================
 *  إعدادات Next.js — أكاشا سينما
 * ============================================================================
 *  يدعم الموقع الآن وضع الخادم (Node.js server) لتشغيل لوحة التحكم والـAPI،
 *  مع إمكانية التصدير الثابت عند ضبط AKASHA_STATIC_EXPORT=1.
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
