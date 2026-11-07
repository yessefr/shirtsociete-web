#!/usr/bin/env node
/*
 * Catalog QA: controleert elk gepubliceerd shirt op wat Google Merchant, Pinterest en
 * aggregators nodig hebben (maat, prijs, foto's, titel, beschrijving, seizoen, match-worn-gegevens).
 * Alleen lezen: wijzigt niets, schrijft alleen een rapport.
 *
 *   node scripts/catalog-qa.js                    rapport (markdown) in de terminal
 *   node scripts/catalog-qa.js --fixture f.json   zonder netwerk
 *   node scripts/catalog-qa.js --strict           exitcode 1 bij FOUT-regels
 *
 * Regel uit AGENTS.md / audit: dit script bevestigt NOOIT herkomst of echtheid. Het controleert alleen
 * of de velden zijn ingevuld en consistent zijn; match-worn-claims blijven menselijke goedkeuring.
 */
'use strict';
const { loadShirts } = require('./lib/shirts-source');
const argv = process.argv.slice(2);

const YEAR = /(19|20)\d{2}/;
const validUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u.trim());

function check(s) {
  const out = []; // [level, text]
  const E = (t) => out.push(['FOUT', t]), W = (t) => out.push(['WAARSCHUWING', t]), I = (t) => out.push(['INFO', t]);
  const title = String(s.title || '').trim();
  const imgs = Array.isArray(s.images) ? s.images : [];
  const good = imgs.filter(validUrl);
  if (title.length < 8) E('titel ontbreekt of is te kort');
  if (title.length > 100) W('titel langer dan 100 tekens (afgekapt in Google/Pinterest)');
  if (!(parseFloat(s.price) > 0)) E('prijs ontbreekt of is 0');
  if (!good.length) E('geen geldige foto');
  if (imgs.length > good.length) W((imgs.length - good.length) + ' ongeldige foto-verwijzing(en) (bijv. "uploading...")');
  if (good.length === 1) W('maar 1 foto: Merchant/Pinterest presteren beter met achterkant, label en details');
  if (!s.size) W('maat ontbreekt (Merchant en aggregators vragen hierom)');
  if (!s.club) W('club ontbreekt');
  if (!YEAR.test(String(s.season || '')) && !YEAR.test(title)) W('seizoen/jaartal ontbreekt');
  const desc = String(s.description || '').trim();
  if (desc.length < 40) W('beschrijving ontbreekt of is erg kort');
  if (!s.category) W('categorie ontbreekt');
  if (s.category === 'match_worn') {
    if (!String(s.mw_type || '').trim()) W('match worn zonder mw_type (Match Worn / Match Issued / Player Issue?)');
    if (!s.mw_coa) I('match worn zonder COA-gegevens (bewust? controleer handmatig)');
  }
  if (/uploading/i.test(JSON.stringify(imgs))) E('foto-lijst bevat "uploading..."');
  return out;
}

(async () => {
  const shirts = await loadShirts(argv);
  const live = shirts.filter((s) => s && s.id && !s.is_draft);
  const avail = live.filter((s) => s.available !== false);
  const rows = []; const counts = { FOUT: 0, WAARSCHUWING: 0, INFO: 0 };
  const titles = {};
  live.forEach((s) => { const k = String(s.title || '').trim().toLowerCase(); if (k) (titles[k] = titles[k] || []).push(s); });
  live.forEach((s) => {
    const r = check(s);
    const dup = titles[String(s.title || '').trim().toLowerCase()];
    if (dup && dup.length > 1) r.push(['WAARSCHUWING', 'identieke titel bij ' + (dup.length - 1) + ' ander(e) shirt(s)']);
    if (r.length) rows.push({ s, r });
    r.forEach(([l]) => counts[l]++);
  });
  console.log('# Catalogus-QA');
  console.log('');
  console.log('Gepubliceerd: ' + live.length + ' (te koop: ' + avail.length + ', verkocht: ' + (live.length - avail.length) + ').');
  console.log('Meldingen: ' + counts.FOUT + ' fout, ' + counts.WAARSCHUWING + ' waarschuwing, ' + counts.INFO + ' info.');
  console.log('');
  const order = { FOUT: 0, WAARSCHUWING: 1, INFO: 2 };
  rows.sort((a, b) => Math.min(...a.r.map((x) => order[x[0]])) - Math.min(...b.r.map((x) => order[x[0]])));
  rows.forEach(({ s, r }) => {
    console.log('- **' + (s.title || '(zonder titel)') + '** (`' + s.id + '`' + (s.available === false ? ', verkocht' : '') + ')');
    r.sort((a, b) => order[a[0]] - order[b[0]]).forEach(([l, t]) => console.log('  - ' + l + ': ' + t));
  });
  if (!rows.length) console.log('Geen opmerkingen. Alles ingevuld.');
  console.log('');
  console.log('_Alleen een veldcontrole. Herkomst, echtheid en match-worn-claims worden niet beoordeeld: dat blijft menselijke goedkeuring._');
  if (argv.includes('--strict') && counts.FOUT) process.exit(1);
})().catch((e) => { console.error('FOUT:', e.message); process.exit(1); });
