#!/usr/bin/env node
/*
 * Shirt Société: statische site-audit (geen netwerk, geen afhankelijkheden).
 *
 *   node scripts/audit.js              rapport in de terminal
 *   node scripts/audit.js --json       machineleesbaar (voor de workflow)
 *   node scripts/audit.js --strict     exitcode 1 bij elke FOUT
 *   node scripts/audit.js --fail-on=Code,Beveiliging   exitcode 1 alleen bij FOUT in die gebieden
 *
 * Draait over alle .html in de repo, sitemap.xml en robots.txt. Het script
 * wijzigt nooit bestanden. Zie .github/workflows/controle.yml.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);
const SITE = 'https://shirtsociete.com';
const NEXT_FAIR = { city: 'Essen', date: '2026-11-14' };           // zie AGENTS.md
const PAST_FAIRS = ['Leipzig', 'Hamburg', 'STANDS', 'Cologne', 'Köln', 'Düsseldorf', 'Frankfurt'];

const findings = [];    // { level: 'FOUT'|'WAARSCHUWING'|'INFO', area, file, msg }
const add = (level, area, file, msg) => findings.push({ level, area, file, msg });
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'rapporten') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const all = walk(ROOT, []);
const htmlFiles = all.filter((f) => f.endsWith('.html'));
const read = (f) => fs.readFileSync(f, 'utf8');

// ── bestaan van een interne URL ──────────────────────────────────────────
function urlExists(u) {
  let p = u.split('#')[0].split('?')[0];
  if (!p || p === '/') return true;
  p = decodeURIComponent(p);
  const abs = path.join(ROOT, p);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return true;
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return fs.existsSync(path.join(abs, 'index.html'));
  if (fs.existsSync(abs + '.html')) return true;
  return false;
}

// ── 1. per pagina ────────────────────────────────────────────────────────
const titles = new Map();
const descs = new Map();
const stats = { pages: htmlFiles.length, generated: 0, inlineKB: {}, cloudinary: {}, noAlt: {}, noLazy: {}, noDims: {} };

for (const f of htmlFiles) {
  const html = read(f);
  const name = rel(f);
  if (html.includes('<!-- ss-moved -->')) { stats.movedStubs = (stats.movedStubs || 0) + 1; continue; }   // doorverwijzing, geen echte pagina
  const generated = /^(products|collections|clubs|national-teams|journal|sold-football-shirts)\//.test(name);
  if (generated) stats.generated++;
  const headHtml = (html.match(/<head[\s\S]*?<\/head>/i) || [html.slice(0, 6000)])[0];
  const isIndexable = !/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(headHtml);

  // title / description / canonical / og
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || [])[1];
  const canon = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i) || [])[1];
  if (isIndexable && !/^(admin|journal-data)\.html$/.test(name)) {
    if (!title) add('FOUT', 'SEO', name, 'geen <title>');
    else {
      const t = title.trim().replace(/\s+/g, ' ');
      if (t.length > 70) add('WAARSCHUWING', 'SEO', name, `title is ${t.length} tekens (max ±60-70)`);
      if (!generated || true) { if (!titles.has(t)) titles.set(t, []); titles.get(t).push(name); }
    }
    if (!desc) add('WAARSCHUWING', 'SEO', name, 'geen meta description');
    else {
      if (desc.length > 165) add('WAARSCHUWING', 'SEO', name, `description is ${desc.length} tekens (max ±155-160)`);
      if (desc.length < 50) add('WAARSCHUWING', 'SEO', name, `description is kort (${desc.length} tekens)`);
      if (!descs.has(desc)) descs.set(desc, []); descs.get(desc).push(name);
    }
    if (!canon) add('WAARSCHUWING', 'SEO', name, 'geen canonical');
    else if (canon.startsWith(SITE)) {
      const local = canon.slice(SITE.length) || '/';
      if (!urlExists(local)) add('FOUT', 'SEO', name, `canonical wijst naar niet-bestaande pagina: ${canon}`);
    }
    if (!/<meta[^>]+property=["']og:image["']/i.test(html)) add('WAARSCHUWING', 'SEO', name, 'geen og:image');
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) add('FOUT', 'Mobiel', name, 'geen viewport-meta');
    if (!/<html[^>]+lang=/i.test(html)) add('WAARSCHUWING', 'Toegankelijkheid', name, 'geen lang-attribuut op <html>');
    const h1 = (html.match(/<h1[\s>]/gi) || []).length;
    if (h1 === 0 && name !== 'index.html') add('WAARSCHUWING', 'SEO', name, 'geen <h1>');
    if (h1 > 1) add('INFO', 'SEO', name, `${h1} keer <h1>`);
  }

  // JSON-LD moet parsen
  for (const m of (name === 'admin.html' ? [] : html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))) {
    try { JSON.parse(m[1]); } catch (e) { add('FOUT', 'SEO', name, 'ongeldige JSON-LD: ' + e.message.slice(0, 60)); }
  }

  // inline scripts moeten syntactisch kloppen
  let si = 0;
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    si++;
    if (/src=|ld\+json|type=["'](?!module|text\/javascript)/i.test(m[1])) continue;
    try { new vm.Script(m[2], { filename: name + '#script' + si }); }
    catch (e) { add('FOUT', 'Code', name, `script ${si}: ${e.message.slice(0, 80)}`); }
  }

  // divs gelijk
  const o = (html.match(/<div[\s>]/gi) || []).length, c = (html.match(/<\/div>/gi) || []).length;
  if (o !== c) add('FOUT', 'Code', name, `<div ${o} tegen </div> ${c}`);

  // gewicht
  const inlineBytes = [...html.matchAll(/<(script|style)[^>]*>([\s\S]*?)<\/\1>/gi)].reduce((a, m) => a + m[2].length, 0);
  stats.inlineKB[name] = Math.round(html.length / 1024);
  if (html.length > 400 * 1024) add('WAARSCHUWING', 'Snelheid', name, `${Math.round(html.length / 1024)} KB HTML (waarvan ${Math.round(inlineBytes / 1024)} KB inline code): elke bezoeker downloadt dit in één keer`);

  // Cloudinary is uitgeschakeld (AGENTS.md: geen Cloudinary meer)
  const cl = new Set(html.match(/https?:\/\/res\.cloudinary\.com\/[^\s"')<>]+/g) || []);
  if (cl.size) { stats.cloudinary[name] = cl.size; }

  // afbeeldingen
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  let noAlt = 0, noLazy = 0, noDims = 0;
  imgs.forEach((t, i) => {
    if (!/\balt=/i.test(t)) noAlt++;
    if (!/\bloading=/i.test(t) && i > 2) noLazy++;
    if (!/\bwidth=/i.test(t) || !/\bheight=/i.test(t)) noDims++;
  });
  if (noAlt) stats.noAlt[name] = noAlt;
  if (noLazy) stats.noLazy[name] = noLazy;
  if (noDims && isIndexable) stats.noDims[name] = noDims;

  // mixed content / http
  const http = (html.match(/(?:src|href)=["']http:\/\/(?!localhost)[^"']+/gi) || []);
  if (http.length) add('WAARSCHUWING', 'Beveiliging', name, `${http.length} http:// (niet versleuteld) adres(sen), bv. ${http[0].slice(0, 70)}`);

  // geheimen
  const secretPatterns = [
    [/sk_(live|test)_[A-Za-z0-9]{16,}/, 'Stripe/Mollie-achtige geheime sleutel'],
    [/live_[A-Za-z0-9]{20,}/, 'Mollie live-sleutel'],
    [/service_role/i, 'verwijzing naar Supabase service_role'],
    [/-----BEGIN (RSA |EC )?PRIVATE KEY-----/, 'private key'],
    [/AKIA[0-9A-Z]{16}/, 'AWS-sleutel'],
    [/api[_-]?secret\s*[:=]\s*["'][^"']{8,}/i, 'api secret'],
  ];
  for (const [re, label] of secretPatterns) if (re.test(html)) add('FOUT', 'Beveiliging', name, `mogelijk geheim in de code: ${label}`);

  // verlopen beurstekst
  for (const city of PAST_FAIRS) {
    const re = new RegExp(`next (?:stop|stand|appearance|fair|event)[^.<]{0,60}${city}`, 'i');
    if (re.test(html)) add('FOUT', 'Inhoud', name, `noemt ${city} nog als volgende beurs (volgende is ${NEXT_FAIR.city})`);
  }

  // render-blokkerende externe scripts
  const extScripts = [...html.matchAll(/<script[^>]+src=["'](https?:[^"']+)["'][^>]*>/gi)].filter((m) => !/\b(async|defer)\b/i.test(m[0]) && !/type=["']module/i.test(m[0]));
  if (extScripts.length && isIndexable) add('WAARSCHUWING', 'Snelheid', name, `${extScripts.length} extern(e) script(s) zonder async/defer (blokkeert tekenen): ${extScripts.map((m) => new URL(m[1]).host).join(', ')}`);

  // interne links
  if (!/^(admin|journal-data)\.html$/.test(name)) {
    const seen = new Set();
    for (const m of html.matchAll(/(?:href|src)=["'](\/[^"'#?]*)/g)) {
      const u = m[1];
      if (u.startsWith('//') || seen.has(u)) continue;
      seen.add(u);
      if (/[{}$]|^\/$/.test(u)) continue;
      if (!urlExists(u)) add('FOUT', 'Links', name, `dode interne link: ${u}`);
    }
  }
}

// dubbele titles/descriptions (alleen niet-gegenereerd én gegenereerd, elk 1 regel)
for (const [t, files] of titles) if (files.length > 1) add('WAARSCHUWING', 'SEO', files[0], `zelfde <title> op ${files.length} pagina's: "${t.slice(0, 60)}" (${files.slice(0, 3).join(', ')}…)`);
for (const [t, files] of descs) if (files.length > 3) add('INFO', 'SEO', files[0], `zelfde description op ${files.length} pagina's`);

// dubbele mappen (clubs/clubs, collections/collections, ...)
for (const f of all) {
  const m = rel(f).match(/^(clubs|collections|national-teams)\/\1\//);
  if (m) { stats.dupDirs = (stats.dupDirs || new Set()).add(m[1]); }
}
if (stats.dupDirs) { const n = all.filter((f) => /^(clubs|collections|national-teams)\/\1\//.test(rel(f))).length; add('WAARSCHUWING', 'Opruimen', [...stats.dupDirs].join(', '), `${n} bestanden in dubbele mappen (bv. clubs/clubs/): kopieën die de generator niet meer bijhoudt; sommige zijn al verouderd`); stats.dupDirs = n; }
{
  const idx = read(path.join(ROOT, 'index.html'));
  stats.indexInlineHandlers = (idx.match(/\sonclick=/g) || []).length;
  stats.indexH1 = (idx.match(/<h1[\s>]/g) || []).length;
}

// ── 2. sitemap en robots ─────────────────────────────────────────────────
const sm = fs.existsSync(path.join(ROOT, 'sitemap.xml')) ? read(path.join(ROOT, 'sitemap.xml')) : '';
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const smDead = locs.filter((u) => u.startsWith(SITE) && !/[?]/.test(u) && !urlExists(u.slice(SITE.length)));
smDead.forEach((u) => add('FOUT', 'Sitemap', 'sitemap.xml', `URL bestaat niet: ${u}`));
locs.filter((u) => /\?/.test(u)).forEach((u) => add('WAARSCHUWING', 'Sitemap', 'sitemap.xml', `URL met query-string (zoekmachines zien dit als dezelfde pagina als de homepage): ${u}`));
const noindexInMap = locs.filter((u) => {
  const p = u.slice(SITE.length) || '/';
  const abs = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  return fs.existsSync(abs) && fs.statSync(abs).isFile() && /<meta[^>]+name=["']robots["'][^>]+noindex/i.test((read(abs).match(/<head[\s\S]*?<\/head>/i) || [''])[0]);
});
noindexInMap.forEach((u) => add('FOUT', 'Sitemap', 'sitemap.xml', `noindex-pagina staat in de sitemap: ${u}`));
const mapped = new Set(locs.map((u) => u.replace(SITE, '')));
const rootPages = htmlFiles.filter((f) => path.dirname(f) === ROOT).map((f) => '/' + rel(f)).filter((p) => !/\/(admin|journal-data|home|404|beurs)\.html$/.test(p));
rootPages.filter((p) => !mapped.has(p) && !mapped.has(p.replace('.html', ''))).forEach((p) => add('INFO', 'Sitemap', 'sitemap.xml', `losse pagina staat niet in de sitemap: ${p}`));
stats.sitemapUrls = locs.length;

// ── 3. gewicht in totaal en samenvatting van Cloudinary ──────────────────
const clTotal = Object.values(stats.cloudinary).reduce((a, b) => a + b, 0);
if (clTotal) add('FOUT', 'Afbeeldingen', `${Object.keys(stats.cloudinary).length} bestanden`, `${clTotal} Cloudinary-adressen in de code; het account is uitgeschakeld (AGENTS.md), dus dit zijn kapotte afbeeldingen of fallbacks. Top: ${Object.entries(stats.cloudinary).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ' ' + v).join(', ')}`);
const naTotal = Object.values(stats.noAlt).reduce((a, b) => a + b, 0);
if (naTotal) add('WAARSCHUWING', 'Toegankelijkheid', `${Object.keys(stats.noAlt).length} bestanden`, `${naTotal} <img> zonder alt (top: ${Object.entries(stats.noAlt).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ' ' + v).join(', ')})`);
const ndTotal = Object.values(stats.noDims).reduce((a, b) => a + b, 0);
if (ndTotal) add('INFO', 'Snelheid', `${Object.keys(stats.noDims).length} bestanden`, `${ndTotal} <img> zonder width/height: de pagina springt tijdens het laden (CLS)`);

// ── 4. uitvoer ───────────────────────────────────────────────────────────
const order = { FOUT: 0, WAARSCHUWING: 1, INFO: 2 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.area.localeCompare(b.area));
const counts = findings.reduce((a, f) => ((a[f.level] = (a[f.level] || 0) + 1), a), {});

if (ARGS.includes('--json')) {
  console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), stats, counts, findings }, null, 2));
} else {
  console.log(`Shirt Société audit  ·  ${stats.pages} pagina's (${stats.generated} gegenereerd)  ·  sitemap ${stats.sitemapUrls} URL's`);
  console.log(`FOUT ${counts.FOUT || 0}  ·  WAARSCHUWING ${counts.WAARSCHUWING || 0}  ·  INFO ${counts.INFO || 0}\n`);
  const grouped = new Map();
  for (const f of findings) { const k = f.level + ' · ' + f.area; if (!grouped.has(k)) grouped.set(k, []); grouped.get(k).push(f); }
  for (const [k, list] of grouped) {
    console.log(`## ${k} (${list.length})`);
    list.slice(0, 12).forEach((f) => console.log(`  - ${f.file}: ${f.msg}`));
    if (list.length > 12) console.log(`  … en ${list.length - 12} meer`);
  }
}
const failOn = (ARGS.find((a) => a.startsWith('--fail-on=')) || '').slice(10).split(',').filter(Boolean);
if (failOn.length && findings.some((f) => f.level === 'FOUT' && failOn.includes(f.area))) process.exit(1);
if (ARGS.includes('--strict') && (counts.FOUT || 0) > 0) process.exit(1);
