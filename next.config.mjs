/**
 * إعدادات Next.js — الموقع يُبنى كموقع ثابت بالكامل (Static Export)
 * السبب: استضافة Vercel المجانية بدون قاعدة بيانات، بدون خادم، وبدون كتابة على نظام الملفات.
 * كل البيانات تُقرأ من مجلد content/ وقت البناء (Build Time) وتتحول إلى صفحات HTML جاهزة.
 */
const nextConfig = {
  output: 'export',          // موقع ثابت 100% (مجلد out/ بعد البناء)
  trailingSlash: true,       // روابط منتهية بـ / (أفضل للاستضافة الثابتة)
  images: { unoptimized: true }, // لأن التحسين التلقائي يحتاج خادم؛ نعتمد صورًا مضغوطة مسبقًا + تحميل كسول
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
