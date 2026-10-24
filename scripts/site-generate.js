#!/usr/bin/env node
/*
 * Ververst de gegenereerde pagina's van de site, zonder zip-bestanden en zonder handwerk:
 *   products/ (alle productpagina's + archief + index)
 *   collections/, clubs/, national-teams/, sold-football-shirts/
 *   sitemap.xml
 *   products.xml (Google Merchant feed)
 *
 * Het gebruikt de ECHTE generators uit admin.html (dezelfde knoppen die jij nu indrukt),
 * in een headless browser. Er is dus geen tweede kopie van de logica die uit de pas kan lopen.
 * De generators krijgen de shirts uit Supabase (publieke leessleutel, dezelfde als in index.html).
 *
 *   node scripts/site-generate.js              schrijft de bestanden
 *   node scripts/site-generate.js --dry        alleen tellen en melden, niets schrijven
 *   node scripts/site-generate.js --fixture f.json   test zonder netwerk
 *
 * Veiligheid: bij een fout of een verdacht klein resultaat wordt er NIETS geschreven.
 * Er worden nooit bestanden verwijderd.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DB_HOST = process.env.SS_DB_HOST || 'https://hzwmjbsfmdkmaoikezoc.supabase.co';
// Publieke "anon"-sleutel (alleen lezen). Dezelfde staat ook in index.html. Geen geheim.
const DB_KEY = process.env.SS_DB_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21qYnNmbWRrbWFvaWtlem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTczNDIsImV4cCI6MjA5MzEzMzM0Mn0.5-ToRrtP3bhkN_qmSMmLM5YXQgE5kWoE0wVpsksqIMs';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const fxIdx = argv.indexOf('--fixture');

async function sb(table, query) {
  const res = await fetch(DB_HOST + '/rest/v1/' + table + query, {
    headers: { apikey: DB_KEY, Authorization: 'Bearer ' + DB_KEY }
  });
  if (!res.ok) throw new Error(table + ': HTTP ' + res.status);
  return res.json();
}

// Vervangt JSZip in de pagina door een recorder: de generators denken dat ze een zip maken,
// wij vangen de bestanden op.
const JSZIP_STUB = `
  window.__captured = [];
  window.JSZip = function (prefix, store) {
    this._p = prefix || ''; this._s = store || {};
  };
  window.JSZip.prototype.folder = function (n) { return new window.JSZip(this._p + n + '/', this._s); };
  window.JSZip.prototype.file = function (n, c) { this._s[this._p + n] = c; return this; };
  window.JSZip.prototype.generateAsync = function () { window.__captured.push(this._s); return Promise.resolve(new Blob([])); };
`;

function sameIgnoringLastmod(a, b) {
  const n = s => s.replace(/<lastmod>[^<]*<\/lastmod>/g, '').trim();
  return n(a) === n(b);
}

async function main() {
  let shirts, archive;
  if (fxIdx > -1) {
    const d = JSON.parse(fs.readFileSync(argv[fxIdx + 1], 'utf8'));
    shirts = d.shirts; archive = d.archive || [];
  } else {
    shirts = await sb('shirts', '?select=*&order=created_at.desc&limit=2000');
    try { archive = await sb('my_collection', '?select=*&order=created_at.desc&limit=2000'); }
    catch (e) { archive = []; console.warn('Archief niet geladen:', e.message); }
  }
  // Sommige shirts hebben in de database nog de tijdelijke tekst "uploading..." in hun fotolijst
  // (een upload die nooit is afgerond). Dat is geen geldige URL: Google keurt dan de hele sitemap
  // af ("Ongeldige URL") en de productpagina krijgt een kapotte afbeelding. Alleen echte
  // http(s)-adressen gaan door naar de generators.
  let droppedImages = 0;
  const cleanImages = list => (list || []).forEach(s => {
    if (!s || !Array.isArray(s.images)) return;
    const ok = s.images.filter(u => typeof u === 'string' && /^https?:\/\//i.test(u.trim()));
    droppedImages += s.images.length - ok.length;
    s.images = ok;
  });
  cleanImages(shirts); cleanImages(archive);
  if (droppedImages) console.log('Let op: ' + droppedImages + ' ongeldige foto-verwijzing(en) overgeslagen (bijv. "uploading..."). Sla die shirts opnieuw op in de admin.');
  const live = shirts.filter(s => s && s.id && !s.is_draft);
  if (live.length < 5) throw new Error('Slechts ' + live.length + ' shirts ontvangen. Dat lijkt fout. Niets geschreven.');
  console.log('Shirts: ' + shirts.length + ' (' + live.length + ' gepubliceerd), archief: ' + archive.length);

  const { chromium } = require('playwright');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.text(); if (/failed/i.test(t) && m.type() === 'error' && !/Failed to load resource/.test(t)) problems.push(t); });
  // admin.html mag geen netwerk gebruiken tijdens het genereren (geen fonts, geen inlog, geen Supabase)
  await page.route(/^(?!file:)/, r => r.abort());
  await page.addInitScript(JSZIP_STUB);
  await page.goto('file://' + path.join(ROOT, 'admin.html'), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof buildProductPagesZip === 'function' && typeof ssBuildCollections === 'function'
    && typeof generateSitemapRun === 'function' && typeof buildMerchantFeed === 'function', null, { timeout: 30000 });

  const out = await page.evaluate(async ({ shirts, archive }) => {
    allShirts = shirts; allArchive = archive;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const result = {};
    window.__captured = [];
    buildProductPagesZip();            await wait(800); result.products = window.__captured.splice(0);
    ssBuildCollections();              await wait(800); result.collections = window.__captured.splice(0);
    generateSitemapRun();              result.sitemap = document.getElementById('sitemap-output').value;
    buildMerchantFeed();               result.feed = _merchantFeedXml;
    return result;
  }, { shirts, archive });
  await browser.close();

  const files = {};
  [].concat(out.products, out.collections).forEach(store => Object.keys(store).forEach(p => { files[p] = store[p]; }));
  files['sitemap.xml'] = out.sitemap;
  files['products.xml'] = out.feed;

  const productPages = Object.keys(files).filter(p => /^products\/[^/]+\.html$/.test(p) && p !== 'products/index.html').length;
  const urls = (out.sitemap.match(/<loc>/g) || []).length;
  const items = (out.feed.match(/<item>/g) || []).length;
  console.log('Gegenereerd: ' + productPages + " productpagina's, " + urls + " sitemap-URL's, " + items + ' producten in de feed, ' + Object.keys(files).length + ' bestanden');
  if (problems.length) console.warn('Meldingen uit de generator:\n  ' + problems.slice(0, 10).join('\n  '));

  // Controle op onzinresultaat
  if (productPages < live.length * 0.9) throw new Error('Maar ' + productPages + " productpagina's voor " + live.length + ' shirts. Niets geschreven.');
  if (!urls || !items) throw new Error('Lege sitemap of feed. Niets geschreven.');
  if (/undefined|\[object Object\]|NaN/.test(out.feed)) throw new Error('Feed bevat "undefined" of "NaN". Niets geschreven.');

  let changed = 0, same = 0, created = 0;
  Object.keys(files).sort().forEach(rel => {
    if (rel.includes('..')) return;
    const abs = path.join(ROOT, rel);
    const content = String(files[rel]);
    const existed = fs.existsSync(abs);
    const old = existed ? fs.readFileSync(abs, 'utf8') : null;
    if (existed && (old === content || (rel === 'sitemap.xml' && sameIgnoringLastmod(old, content)))) { same++; return; }
    if (existed) changed++; else created++;
    if (!DRY) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, content); }
  });
  console.log((DRY ? '[dry run] ' : '') + 'Nieuw: ' + created + ', gewijzigd: ' + changed + ', ongewijzigd: ' + same);
}

main().catch(e => { console.error('FOUT:', e.message); process.exit(1); });
