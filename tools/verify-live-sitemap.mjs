#!/usr/bin/env node
/**
 * End-to-end sitemap check for a deployed site (or the static export preview).
 *
 * Checks the public robots.txt and sitemap.xml using a Googlebot User-Agent,
 * then fetches every sitemap URL and verifies HTTP 200, self-canonical, and
 * indexable HTML. This is a User-Agent simulation, not a request from Google's
 * crawler IPs or a substitute for the Search Console Sitemaps report.
 *
 * Usage:
 *   npm run seo:live
 *   SITE_URL=http://127.0.0.1:4000 npm run seo:live  # local static preview
 *   PUBLIC_SITE_URL=https://example.com SITE_URL=https://preview.example.com npm run seo:live
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import siteConfig from '../site.config.mjs';

const GOOGLEBOT_USER_AGENT = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
const SITEMAP_PATH = '/sitemap.xml';
const ROBOTS_PATH = '/robots.txt';
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const MAX_SITEMAP_BYTES = 50 * 1024 * 1024;
const MAX_URLS = 50_000;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeOrigin(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be an absolute HTTP(S) origin: ${value}`);
  }
  requireCondition(['http:', 'https:'].includes(url.protocol), `${label} must use HTTP or HTTPS.`);
  requireCondition(url.pathname === '/' && !url.search && !url.hash, `${label} must not include a path, query, or fragment.`);
  requireCondition(!url.username && !url.password, `${label} must not include credentials.`);
  return url.origin;
}

function decodeXmlText(value) {
  const unknownEntity = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/i;
  requireCondition(!unknownEntity.test(value), `Invalid/unescaped XML entity in <loc>: ${value}`);
  return value.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (entity) => {
    const name = entity.slice(1, -1);
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (Object.hasOwn(named, name)) return named[name];
    const codePoint = name[1]?.toLowerCase() === 'x'
      ? Number.parseInt(name.slice(2), 16)
      : Number.parseInt(name.slice(1), 10);
    requireCondition(Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff, `Invalid XML character reference: ${entity}`);
    return String.fromCodePoint(codePoint);
  });
}

export function parseSitemapXml(xml) {
  requireCondition(typeof xml === 'string' && xml.length > 0, 'Sitemap response is empty.');
  requireCondition(Buffer.byteLength(xml, 'utf8') <= MAX_SITEMAP_BYTES, 'Sitemap exceeds the 50 MiB limit.');
  requireCondition(!/<!DOCTYPE|<!ENTITY/i.test(xml), 'Sitemap must not contain a DTD or entity declaration.');
  requireCondition(
    /^\s*<\?xml\s+version="1\.0"\s+encoding="UTF-8"\s*\?>\s*<urlset\b/i.test(xml),
    'Sitemap must be an XML document with a <urlset> root.'
  );

  const root = xml.match(/<urlset\b([^>]*)>/i);
  requireCondition(root, 'Sitemap is missing its <urlset> root.');
  const namespace = root[1].match(/\bxmlns\s*=\s*(["'])(.*?)\1/i)?.[2];
  requireCondition(namespace === SITEMAP_NAMESPACE, `Unexpected sitemap namespace: ${namespace ?? '(missing)'}`);
  requireCondition(/<\/urlset>\s*$/i.test(xml), 'Sitemap has no closing </urlset> tag.');

  const blocks = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)];
  const openTags = (xml.match(/<url\b[^>]*>/gi) ?? []).length;
  const closeTags = (xml.match(/<\/url\s*>/gi) ?? []).length;
  requireCondition(blocks.length > 0, 'Sitemap contains no <url> entries.');
  requireCondition(openTags === blocks.length && closeTags === blocks.length, 'Sitemap contains malformed or unclosed <url> entries.');
  requireCondition(blocks.length <= MAX_URLS, `Sitemap exceeds the ${MAX_URLS.toLocaleString()} URL limit.`);

  const locations = blocks.map(([, block], index) => {
    const locs = [...block.matchAll(/<loc\s*>([\s\S]*?)<\/loc\s*>/gi)];
    requireCondition(locs.length === 1, `Sitemap entry ${index + 1} must contain exactly one <loc>.`);
    const raw = locs[0][1].trim();
    requireCondition(raw.length > 0 && !/<[^>]+>/.test(raw), `Sitemap entry ${index + 1} has an invalid <loc>.`);
    return decodeXmlText(raw);
  });
  const totalLocs = (xml.match(/<loc\b/gi) ?? []).length;
  requireCondition(totalLocs === locations.length, 'Sitemap contains a <loc> outside a valid <url> entry.');
  requireCondition(new Set(locations).size === locations.length, 'Sitemap contains duplicate URLs.');
  requireCondition(!/<lastmod\b/i.test(xml), 'Sitemap contains lastmod values that this site cannot verify.');
  return locations;
}

function tagAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
}

function canonicalFromHtml(html) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag);
  const canonical = links.find((tag) => (tagAttribute(tag, 'rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'));
  return canonical ? tagAttribute(canonical, 'href') : null;
}

function hasNoindex(html, response) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => tag);
  const metaDirectives = metas
    .filter((tag) => ['robots', 'googlebot', 'googlebot-news'].includes((tagAttribute(tag, 'name') ?? '').toLowerCase()))
    .map((tag) => tagAttribute(tag, 'content') ?? '');
  const headerDirectives = response.headers.get('x-robots-tag') ?? '';
  return /\bnoindex\b/i.test([...metaDirectives, headerDirectives].join(', '));
}

async function request(url, { accept, timeoutMs }) {
  return fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: {
      accept,
      'user-agent': GOOGLEBOT_USER_AGENT,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function mapWithConcurrency(values, concurrency, worker) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= values.length) return;
      await worker(values[index], index);
    }
  });
  await Promise.all(workers);
}

/**
 * Verify a live origin. `publicBase` is the canonical/public domain in sitemap
 * entries; `requestBase` can be a Vercel preview or local static server used to
 * fetch the same exported paths.
 */
export async function verifyLiveSitemap({
  requestBase = siteConfig.url,
  publicBase = siteConfig.url,
  concurrency = 6,
  timeoutMs = 20_000,
} = {}) {
  const requestOrigin = normalizeOrigin(requestBase, 'SITE_URL');
  const publicOrigin = normalizeOrigin(publicBase, 'PUBLIC_SITE_URL');
  const publicSitemapUrl = `${publicOrigin}${SITEMAP_PATH}`;
  const errors = [];

  const robotsUrl = `${requestOrigin}${ROBOTS_PATH}`;
  const robotsResponse = await request(robotsUrl, { accept: 'text/plain', timeoutMs });
  requireCondition(robotsResponse.status === 200, `robots.txt returned HTTP ${robotsResponse.status}, expected 200.`);
  requireCondition(/^text\/plain(?:\s*;|$)/i.test(robotsResponse.headers.get('content-type') ?? ''), 'robots.txt must be served as text/plain.');
  const robotsText = await robotsResponse.text();
  requireCondition(robotsResponse.url === robotsUrl, 'robots.txt unexpectedly redirected.');
  requireCondition(/^User-agent:\s*\*\s*$/im.test(robotsText), 'robots.txt must contain a User-agent: * group.');
  requireCondition(/^Allow:\s*\/\s*$/im.test(robotsText), 'robots.txt must explicitly allow public crawling.');
  requireCondition(!/^Disallow:\s*\S/im.test(robotsText), 'robots.txt contains a non-empty Disallow rule that may block sitemap pages.');
  requireCondition(!/^Host\s*:/im.test(robotsText), 'robots.txt contains the unsupported Host directive.');
  const sitemapDirectives = robotsText.split(/\r?\n/).filter((line) => /^\s*Sitemap\s*:/i.test(line));
  requireCondition(sitemapDirectives.length === 1, `robots.txt must contain exactly one Sitemap directive; found ${sitemapDirectives.length}.`);
  requireCondition(sitemapDirectives[0].replace(/^\s*Sitemap\s*:\s*/i, '').trim() === publicSitemapUrl, `robots.txt points to the wrong sitemap: ${sitemapDirectives[0]}`);

  const sitemapRequestUrl = `${requestOrigin}${SITEMAP_PATH}`;
  const sitemapResponse = await request(sitemapRequestUrl, { accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8', timeoutMs });
  requireCondition(sitemapResponse.status === 200, `sitemap.xml returned HTTP ${sitemapResponse.status}, expected 200.`);
  requireCondition(/^(?:application|text)\/xml(?:\s*;|$)/i.test(sitemapResponse.headers.get('content-type') ?? ''), `sitemap.xml has an invalid Content-Type: ${sitemapResponse.headers.get('content-type') ?? '(missing)'}`);
  requireCondition(sitemapResponse.url === sitemapRequestUrl, 'sitemap.xml unexpectedly redirected.');
  const xml = await sitemapResponse.text();
  const locations = parseSitemapXml(xml);

  for (const location of locations) {
    let url;
    try {
      url = new URL(location);
    } catch {
      errors.push(`Invalid absolute URL in sitemap: ${location}`);
      continue;
    }
    if (
      url.protocol !== 'https:' ||
      url.origin !== publicOrigin ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      !url.pathname.endsWith('/') ||
      url.href !== location
    ) {
      errors.push(`Sitemap URL is not a normalized HTTPS URL on ${publicOrigin}: ${location}`);
    }
  }
  if (errors.length) {
    throw new Error(`Sitemap URL validation failed (${errors.length} issue(s)):\n${errors.slice(0, 20).map((error) => `- ${error}`).join('\n')}`);
  }

  let checkedPages = 0;
  await mapWithConcurrency(locations, concurrency, async (location) => {
    const publicUrl = new URL(location);
    const pageUrl = `${requestOrigin}${publicUrl.pathname}`;
    try {
      const response = await request(pageUrl, { accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8', timeoutMs });
      if (response.status !== 200) {
        errors.push(`${location}: HTTP ${response.status}, expected 200.`);
        return;
      }
      if (!/^text\/html(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
        errors.push(`${location}: expected text/html, got ${response.headers.get('content-type') ?? '(missing)'}.`);
        return;
      }
      if (response.url !== pageUrl) {
        errors.push(`${location}: unexpectedly redirected to ${response.url}.`);
        return;
      }
      const html = await response.text();
      if (canonicalFromHtml(html) !== location) {
        errors.push(`${location}: missing or mismatched canonical URL (${canonicalFromHtml(html) ?? 'none'}).`);
      }
      if (hasNoindex(html, response)) {
        errors.push(`${location}: page is marked noindex.`);
      }
      checkedPages++;
    } catch (error) {
      errors.push(`${location}: request failed (${error?.message ?? String(error)}).`);
    }
  });

  if (errors.length) {
    throw new Error(`Live sitemap check failed (${errors.length} issue(s)):\n${errors.slice(0, 30).map((error) => `- ${error}`).join('\n')}`);
  }

  return {
    userAgent: GOOGLEBOT_USER_AGENT,
    robotsStatus: robotsResponse.status,
    robotsContentType: robotsResponse.headers.get('content-type'),
    sitemapStatus: sitemapResponse.status,
    sitemapContentType: sitemapResponse.headers.get('content-type'),
    sitemapBytes: Buffer.byteLength(xml, 'utf8'),
    urlCount: locations.length,
    checkedPages,
    publicSitemapUrl,
  };
}

async function main() {
  const requestBase = process.env.SITE_URL || siteConfig.url;
  const publicBase = process.env.PUBLIC_SITE_URL || siteConfig.url;
  const concurrency = Number(process.env.SITEMAP_VERIFY_CONCURRENCY || 6);
  const timeoutMs = Number(process.env.SITEMAP_VERIFY_TIMEOUT_MS || 20_000);
  requireCondition(Number.isInteger(concurrency) && concurrency > 0 && concurrency <= 32, 'SITEMAP_VERIFY_CONCURRENCY must be an integer from 1 to 32.');
  requireCondition(Number.isInteger(timeoutMs) && timeoutMs >= 1000, 'SITEMAP_VERIFY_TIMEOUT_MS must be at least 1000 ms.');

  const result = await verifyLiveSitemap({ requestBase, publicBase, concurrency, timeoutMs });
  console.log(`✅ robots.txt: HTTP ${result.robotsStatus} · ${result.robotsContentType} · allows crawling + points to sitemap.`);
  console.log(`✅ sitemap.xml: HTTP ${result.sitemapStatus} · ${result.sitemapContentType} · ${result.sitemapBytes.toLocaleString()} bytes · ${result.urlCount} unique HTTPS URLs.`);
  console.log(`✅ ${result.checkedPages}/${result.urlCount} sitemap pages: HTTP 200, self-canonical, indexable (User-Agent simulation: ${result.userAgent}).`);
  console.log(`Sitemap: ${result.publicSitemapUrl}`);
  console.log('Note: this verifies public HTTP access and a Googlebot User-Agent simulation; only Search Console can confirm Google’s own fetch/report.');
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((error) => {
    console.error(`❌ ${error?.message ?? error}`);
    process.exitCode = 1;
  });
}
