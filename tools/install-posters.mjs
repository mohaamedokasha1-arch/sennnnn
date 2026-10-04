#!/usr/bin/env node
/**
 * سكربت تركيب البوسترات الرسمية المُتحقَّق منها بصريًا (مرة واحدة).
 * ينسخ الصورة المختارة إلى public/posters/ ويحدّث حقول poster/posterAlt/posterAltEn
 * وجملة ملاحظة البوستر داخل ملف المحتوى لكل عمل.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = (f) => path.join(ROOT, 'image-search', f);
const DST = (f) => path.join(ROOT, 'public', 'posters', f);

const TEASER = 'The poster shown is the official teaser poster released by the studio.';
const THEATRICAL = 'The poster shown is the official theatrical poster released by the studio.';
const LOGO = 'The poster shown is the official logo/title teaser poster released by the studio.';
const ANNOUNCE = 'The poster shown is the official announcement poster released by the studio.';
const INTL = 'The poster shown is the official international one-sheet released by the studio.';
const OLD_SENTENCE = 'Poster is an original design artwork created for this site.';

const PLAN = [
  { slug: 'a-minecraft-movie-squared', src: 'a-minecraft-movie-squared-2027-official--2.jpg', ext: 'jpg', note: TEASER,
    ar: 'البوستر التشويقي الرسمي لفيلم ماينكرافت: الفيلم 2 (2027) — شعار الفيلم داخل إطار من مكعبات بكسلية',
    en: 'Official teaser poster for A Minecraft Movie Squared (2027) — film logo framed by pixel blocks' },
  { slug: 'gatto', src: 'gatto-2027-pixar-animated-movie-official-2.jpg', ext: 'jpg', note: TEASER,
    ar: 'البوستر التشويقي الرسمي لفيلم غاتو Gatto (2027) من ديزني·بيكسار — قطة سوداء مقلوبة أمام القمر فوق قنوات البندقية',
    en: "Official teaser poster for Pixar's Gatto (2027) — a black cat hanging upside-down before the moon over Venice's canals" },
  { slug: 'godzilla-x-kong-supernova', src: 'godzilla-x-kong-supernova-2027-official--1.jpg', ext: 'jpg', note: LOGO,
    ar: 'بوستر الشعار التشويقي الرسمي لفيلم غودزيلا ضد كونغ: المستعر الأعظم (2027)',
    en: 'Official logo teaser poster for Godzilla x Kong: Supernova (2027)' },
  { slug: 'hexed-2026', src: 'hexed-disney-2026-animated-film-official-1.jpg', ext: 'jpg', note: TEASER,
    ar: 'البوستر التشويقي الرسمي لفيلم هيكسد Hexed (2026) من ديزني — البطلة بيلي تطفو وسط أغراضها المسحورة',
    en: "Official teaser poster for Disney's Hexed (2026) — Billie floating amid her enchanted belongings" },
  { slug: 'how-to-rob-a-bank', src: 'how-to-rob-a-bank-2026-netflix-movie-off-2.jpg', ext: 'jpg', note: THEATRICAL,
    ar: 'البوستر الرسمي لفيلم كيف تسرق بنكًا (2026) — طاقم السطو بأقنعة الحيوانات',
    en: 'Official theatrical poster for How to Rob a Bank (2026) — the heist crew in animal masks' },
  { slug: 'moana-live-action', src: 'moana-live-action-2026-disney-official-m-2.webp', ext: 'webp', note: THEATRICAL,
    ar: 'البوستر الرسمي للنسخة الحية من موانا (2026) — موانا وماوي وسط الأمواج',
    en: 'Official theatrical poster for the live-action Moana (2026) — Moana and Maui amid the waves' },
  { slug: 'mortal-kombat-ii', src: 'impawards-mortal-kombat-ii-2026-movie-po-3.jpg', ext: 'jpg', note: INTL,
    ar: 'البوستر الرسمي الدولي لفيلم مورتال كومبات 2 (2026) — شعار التنين وشخصيات البطولة',
    en: 'Official international one-sheet for Mortal Kombat II (2026) — dragon emblem and ensemble cast' },
  { slug: 'supergirl-2026', src: 'supergirl-2026-movie-first-look-poster-m-1.jpg', ext: 'jpg', note: THEATRICAL,
    ar: 'البوستر الرسمي لفيلم سوبرغيرل (2026) — ميلي ألكوك بمعطف بني أمام شعار S',
    en: "Official theatrical poster for Supergirl (2026) — Milly Alcock in a brown trench coat before the S shield" },
  { slug: 'the-batman-part-ii', src: 'the-batman-part-ii-2028-official-movie-p-3.jpg', ext: 'jpg', note: LOGO,
    ar: 'بوستر الشعار الرسمي لفيلم باتمان: الجزء الثاني (2028)',
    en: 'Official logo teaser poster for The Batman Part II (2028)' },
  { slug: 'the-conjuring-first-communion', src: 'the-conjuring-first-communion-movie-offi-2.jpg', ext: 'jpg', note: LOGO,
    ar: 'بوستر الشعار الرسمي لفيلم الشعوذة: التناول الأول (2027)',
    en: 'Official title teaser poster for The Conjuring: First Communion (2027)' },
  { slug: 'the-florist-2026', src: 'the-florist-2026-movie-official-poster-3.jpg', ext: 'jpg', note: THEATRICAL,
    ar: 'البوستر الرسمي لفيلم بائع الزهور The Florist (2026) — دينيس كويد يشهر مسدسه',
    en: 'Official poster for The Florist (2026) — Dennis Quaid aiming a pistol' },
  { slug: 'the-hunt-for-gollum', src: 'the-lord-of-the-rings-the-hunt-for-gollu-1.jpg', ext: 'jpg', note: TEASER,
    ar: 'البوستر التشويقي الرسمي لفيلم سيد الخواتم: مطاردة غولوم (2027) — غولوم تحت شعاع ضوء في الكهف',
    en: 'Official teaser poster for The Lord of the Rings: The Hunt for Gollum (2027) — Gollum beneath a shaft of light' },
  { slug: 'the-influencer-project', src: 'the-influencer-project-2026-movie-offici-1.jpg', ext: 'jpg', note: THEATRICAL,
    ar: 'البوستر الرسمي لفيلم مشروع المؤثرة (2026) — هاتف داخل حلقة إضاءة متوهجة',
    en: 'Official poster for The Influencer Project (2026) — a phone inside a glowing ring light' },
  { slug: 'the-mandalorian-and-grogu', src: 'the-mandalorian-and-grogu-2026-official--3.jpg', ext: 'jpg', note: TEASER,
    ar: 'البوستر التشويقي الرسمي لفيلم الماندالوري وغروغو (2026) — خوذة دين دجارين وغروغو المتطلع',
    en: "Official teaser poster for The Mandalorian and Grogu (2026) — Din Djarin's helmet and peeking Grogu" },
  { slug: 'the-odyssey-2026', src: 'the-odyssey-christopher-nolan-2026-offic-1.jpg', ext: 'jpg', note: TEASER,
    ar: 'البوستر التشويقي الرسمي لفيلم الأوديسة The Odyssey (2026) إخراج كريستوفر نولان',
    en: "Official teaser poster for Christopher Nolan's The Odyssey (2026)" },
  { slug: 'the-simpsons-movie-2', src: 'the-simpsons-movie-2-2027-official-poste-1.jpg', ext: 'jpg', note: ANNOUNCE,
    ar: 'بوستر الإعلان الرسمي لفيلم عائلة سيمبسون: الفيلم 2 (2027) — هومر يحمل علم موعد العرض الجديد',
    en: 'Official announcement poster for The Simpsons Movie 2 (2027) — Homer holding the new release-date flag' },
  { slug: 'toy-story-5', src: 'toy-story-5-2026-official-teaser-movie-p-2.jpg', ext: 'jpg', note: TEASER,
    ar: 'البوستر التشويقي الرسمي لفيلم حكاية لعبة 5 (2026) — وودي وبوز وجيسي أمام شاشة الجهاز اللوحي الضفدعي',
    en: 'Official teaser poster for Toy Story 5 (2026) — Woody, Buzz and Jessie facing the frog tablet screen' },
];

let copied = 0, updated = 0, missingSentence = [];
for (const p of PLAN) {
  const from = SRC(p.src);
  const to = DST(`${p.slug}.${p.ext}`);
  if (!fs.existsSync(from)) { console.error('MISSING SRC', from); continue; }
  fs.copyFileSync(from, to);
  copied++;

  const mdPath = path.join(ROOT, 'content', 'movies', `${p.slug}.md`);
  let md = fs.readFileSync(mdPath, 'utf8');
  md = md.replace(/^poster: .*$/m, `poster: "/posters/${p.slug}.${p.ext}"`);
  md = md.replace(/^posterAlt: .*$/m, `posterAlt: "${p.ar}"`);
  md = md.replace(/^posterAltEn: .*$/m, `posterAltEn: "${p.en}"`);
  if (md.includes(OLD_SENTENCE)) md = md.split(OLD_SENTENCE).join(p.note);
  else missingSentence.push(p.slug);
  fs.writeFileSync(mdPath, md);
  updated++;
  console.log(`✔ ${p.slug} ← ${p.src}`);
}
console.log(`\ncopied=${copied} updated=${updated}`);
if (missingSentence.length) console.log('files without the old design sentence (check notes manually):', missingSentence.join(', '));
