# Execution Depth Map — Akasha Cenima rebrand, localization and SEO

**Audit date:** 2026-10-07 (UTC)  
**Repository:** `mohaamedokasha1-arch/sennnnn`  
**Branch:** `arena/d6ca4cf6-sennnnn`  
**Product boundary:** a movie/series discovery catalog—not a video host or streaming service.

## Executive result

The English brand spelling is **Akasha Cenima** throughout the visible brand, metadata, wordmarks, cover watermarks and artwork. The bilingual brand system, logo/icon assets, localized social imagery, metadata rules, static indexing checks and series-cover rebrand are implemented. The production static export and all repository tests pass. No core layout, color system, navigation behavior or product feature was redesigned.

**Verified locally:** 413 canonical sitemap URLs, 67 reciprocal Arabic/English movie pairs, 413 unique in-range title/description pairs, 552 exported HTML files checked for internal links and local images, 2,159 valid JSON-LD objects, and all required PWA/logo assets. A local production-preview server also returned the expected 200/404 statuses.

**Not verified:** the deployed website, actual Search Console ownership/indexing, third-party link availability, Lighthouse/Core Web Vitals, or browser installation UX. The previous HTTPS request to the configured live host failed during TLS; no live-site claim is made here.

## Phase map

| Phase | Work completed | Evidence / status |
|---|---|---|
| 1. Product and change boundary | Preserved the existing discovery-site positioning. No streaming player, hosting or new browsing feature was added. Kept existing favorites persistence identifiers to avoid deleting saved user data. | Source copy and tests continue to identify official links/trailers as external/verified and state that the site does not host video. |
| 2. Central brand and locale model | `site.config.mjs` now centralizes Arabic/English display names, short names, descriptions, slogans and valid logo paths. `lib/brand.mjs` exposes locale-aware names, direction, alt text and asset URLs. Brand interpolation is used in localized interface strings. | Arabic resolves to `أكاشا سينما` / RTL; English resolves to `Akasha Cenima` / LTR. `npm run test:seo` covers locale/name and route behavior. |
| 3. Header/footer and logo assets | Integrated the configured 192px brand-mark asset into the existing header/footer lockup while retaining the existing dynamic text wordmark, spacing and mobile behavior. Added five standalone SVG wordmark variants plus ICO and 192/512 PNG icons. | Build audit verifies all configured and standalone assets exist; all SVGs parse as XML and have accessible titles. Full wordmark SVGs remain independent assets rather than replacing the responsive text lockup. |
| 4. Localized sharing artwork | Extended `tools/make-assets.py` to produce an English 1200×630 Open Graph image in addition to the Arabic image and to generate the favicon files. `lib/seo.mjs` selects a per-locale fallback while preferring a work poster where available. | Both exported social images are 1200×630 and locally present. Metadata audit requires first-party absolute OG URLs and equal Twitter/OG image URLs. |
| 5. Metadata normalization | Centralized route-aware title and description helpers in `lib/seo.mjs`; localized brand suffixes are applied consistently. Corrected homepage metadata so the page title, OG title and Twitter title agree. | All 413 sitemap documents have unique 50–60 character titles and unique 150–160 character descriptions. Open Graph/Twitter title and description match each document. |
| 6. Indexing and localization | Validated self-canonicals, aliases, reciprocal `hreflang`, noindex exclusions, generated sitemap/robots and static English document attributes. The export-preparation script adds English `lang="en" dir="ltr"` where static routing otherwise leaves inherited Arabic root attributes. | `sitemap.xml`: 413 canonical URLs. `sitemap-all.xml`: byte-identical 36,317-byte mirror. 67 reciprocal `ar`/`en`/`x-default` movie pairs. All 134 exported English HTML documents have `lang="en" dir="ltr"`. `robots.txt` allows crawling and points at the configured sitemap. |
| 7. Structured data and error/indexability checks | Validates JSON-LD parsing, Schema.org context/types, rejects invented `aggregateRating` and year-only `datePublished`, and confirms 404/noindex behavior and removal of synthetic empty routes. | 2,159 JSON-LD objects across six emitted types: `Organization`, `WebSite`, `Movie`, `TVSeries`, `Person`, `BreadcrumbList`. Search, favorites and empty reviews/lists are excluded/noindex; exported custom 404 is noindex and is not an indexable sitemap route. |
| 8. Content image rebrand | Updated poster generation to use locale-specific brand names and truthful original-design alt text. Regenerated all series covers and their manifest. | 100 series covers regenerated; 100 content records changed; zero cover-size/weight validation issues. The full export audits 167 local movie/series posters at ≤200 KiB. Movie audit: 42 documented official posters and 25 explicitly labeled original designs; series: 100 original designs and zero text fallbacks. |
| 9. Broken-link and performance checks | Added build-time export auditing for canonical routes, same-origin anchors, local `<img>` sources, metadata images, logo/manifest resources and poster byte budgets. No CSS/script/third-party URL availability probe was represented as a successful external check. | 552 HTML documents scanned; zero broken same-origin links or local `<img>` URLs. Next build reports 103 KB shared JavaScript and 114–120 KB First Load JS by route. Export is about 80 MiB on disk; local gzip estimation for HTML is about 7.0 MiB total (largest page: 428 KiB raw / 28 KiB gzip). Compression figures are estimates, not observed production transfer sizes. |
| 10. Authentication, secrets and configuration | Checked route/config footprint and preserved the static architecture. No login/account/auth route or environment file exists; favorites remain browser-local. Configured verification metadata is tested in exported HTML. | Zero auth/login routes and zero `.env*` files found at the checked repository depth. No authentication system was added because the product has no accounts. |
| 11. Regression and production build | Added `lib/test-seo.mjs` and `npm run test:seo`; updated package metadata and README. Ran the full test command and fresh production static build after the source changes. | `npm test` passes (validation, 8 content-validation scenarios, 45 logic cases, 7 title cases, 4 description cases and poster audits). `npm run build` passes, including static-export preparation, poster audit and SEO/export audit. |
| 12. Runtime preview | Started the repository's static production-preview server on `0.0.0.0:4000`; tested local routes only. | Home, English movie detail, sitemap/mirror, robots, manifest, favicon, 512px icon and English OG image returned 200. Missing route and `/404.html` returned 404. This is a local preview, not a live deployment test. |

## Detailed modification log

### Brand, UI and metadata

- `site.config.mjs`: corrected the English brand spelling to `Akasha Cenima`; centralized `nameByLocale`, `shortNameByLocale`, English description/slogan and logo asset paths. The configured canonical URL and contact email were retained because no verified replacements were provided.
- `lib/brand.mjs`: locale-aware brand configuration, short names, direction, image/wordmark helpers and accessible labels.
- `lib/i18n.mjs`, `components/Brand.jsx`, `components/Logo.jsx`: brand interpolation and shared mark integration; the existing header/footer consume the updated lockup without a structural UI redesign.
- `app/layout.jsx`, `app/en/layout.jsx`, `app/page.jsx`, `app/site.webmanifest/route.js`: localized title/metadata, favicon/manifest references, home OG title/image consistency and Arabic-first PWA metadata.
- Localized copy references were updated in the affected about, rights, people, review, not-found and search components/pages.

### SEO, indexing and audit automation

- `lib/seo.mjs`: locale-aware metadata titles/descriptions, Open Graph/Twitter defaults and localized share-image selection.
- `tools/prepare-static-export.mjs`: English root-language/direction pass and sitemap mirror generation.
- `tools/audit-seo-export.mjs`: expanded assertions for title/description length and uniqueness, locale tags, canonical/OG/Twitter agreement, PWA/logo/social resources, Schema.org coverage, noindex routes, aliases, posters and internal links/images.
- `tools/serve-static.mjs`: preview banner now reads the configured brand name.

### Artwork, generated content and documentation

- `tools/make-assets.py`, `public/og-default-en.jpg`, `public/assets/logo/`: reproducible localized artwork and logo/icon outputs.
- `lib/make-poster.py`, `tools/series-covers-install.mjs`, `tools/poster-hunt/series-covers.json`, and 100 files in `public/posters/`: localized series-cover generation and install manifest.
- `lib/test-seo.mjs`, `package.json`, `README.md`: regression coverage, test script and documentation updates.
- `AUDIT-REPORT-2026-10-05.md`, `SERIES-REPORT.md`, `SERIES-POSTER-AUDIT.md`: updated visible branding references where applicable.

## Remaining limitations and decisions

1. **Live deployment and Search Console:** the configured origin is still `https://cenimana-aflam-arabic.vercel.app`; its previous TLS probe failed. Sitemap generation and verification-tag presence are confirmed locally, but the live server, Search Console ownership and indexing status are not.
2. **Legacy contact/domain values:** the existing `cenimana`-named host and `cenimanafilms@gmail.com` address remain configuration values pending a confirmed replacement. The visible product brand is changed; the external domain/mailbox were not guessed.
3. **Favorites compatibility:** `cinemana:favorites` and its event key remain intentionally unchanged so existing browser-saved favorites are not orphaned. The internal identifiers are not presented in the privacy/cookies page copy and are not the displayed brand.
4. **English scope:** there are 67 reciprocal English/Arabic movie-detail pairs, not a fully translated English home/catalog/navigation. The single PWA manifest uses the Arabic primary locale and starts at `/`; a separate English install entry was not added because the project has no English home route.
5. **Logo wordmark behavior:** standalone horizontal/vertical SVGs are supplied and configured. The responsive header/footer continue to render the selected locale name as text next to the shared mark rather than rasterizing both names into a single fixed SVG.
6. **External links/performance:** content validation checks allowed trailer/platform domains and the static export checks local links/assets. Third-party HTTP status, Lighthouse, Core Web Vitals, browser accessibility automation and deployed transfer compression were not measured.
7. **Dependency audit:** `npm audit` reports four moderate vulnerabilities in the `gray-matter`/`js-yaml` dependency tree (gray-matter is direct; related findings are transitive), zero high and zero critical. npm proposes `gray-matter@2.0.1` as a major-version downgrade; it was not applied without compatibility investigation.
8. **Authentication:** not applicable to this static catalog. The project exposes no account/login routes and stores favorites locally; adding auth would be a new product feature outside the requested rebrand/SEO scope.

## Final status

**Source work and local validation: complete.** **Live-site verification and external indexing confirmation: unverified / blocked by the prior TLS failure.** No streaming functionality was added, and no core layout or color scheme was changed.
