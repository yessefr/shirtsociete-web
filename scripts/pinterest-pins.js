#!/usr/bin/env node
/*
 * Maakt social/pinterest-pins.csv: een lijst met pin-concepten voor Pinterest (bulk-upload),
 * rechtstreeks uit de shirtgegevens. Niets wordt geplaatst: jij uploadt het bestand zelf in
 * Pinterest (Pins maken > Bulk uploaden) of kopieert regels. Zo blijft een mens de baas over wat live gaat.
 *
 *   node scripts/pinterest-pins.js                    schrijft social/pinterest-pins.csv
 *   node scripts/pinterest-pins.js --fixture f.json   zonder netwerk
 *   node scripts/pinterest-pins.js --stdout           naar de terminal, niets schrijven
 *
 * Teksten gebruiken ALLEEN velden uit de database. Er wordt niets geclaimd wat er niet staat:
 * "Match worn" alleen bij category match_worn, "COA" alleen als mw_coa is ingevuld.
 * Per shirt: 1 productpin (foto 1) + tot 2 extra pins (foto 2 en 3). Er wordt NIET beweerd wat die foto's tonen
 * (achterkant, label): de volgorde in de database is niet gecontroleerd. Pas de tekst aan als je dat wel weet.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { loadShirts } = require('./lib/shirts-source');
const argv = process.argv.slice(2);
const SITE = 'https://shirtsociete.com';

// ssShirtSlug staat in admin.html; hier een gelijke weergave via de feed-link als die beschikbaar is.
function slugFromFeed() {
  const map = {};
  try {
    const xml = fs.readFileSync(path.join(__dirname, '..', 'products.xml'), 'utf8');
    xml.replace(/<g:id>([^<]+)<\/g:id>[\s\S]*?<g:link>([^<]+)<\/g:link>/g, (m, id, link) => { map[id] = link; return m; });
  } catch (e) { /* geen feed: val terug op winkelpagina */ }
  return map;
}

const NL_CLUBS = /ajax|feyenoord|psv|az alkmaar|netherlands|nederland|holland|oranje/i;
function board(s) {
  const t = [s.title, s.club].join(' ');
  if (s.category === 'match_worn') return 'Match Worn Football Shirts';
  if (/bayern/i.test(t)) return 'Bayern München Shirts';
  if (NL_CLUBS.test(t)) return 'Netherlands Football Shirts';
  const y = (String(s.season || s.title || '').match(/(19|20)\d{2}/) || [])[0];
  if (y && +y >= 1990 && +y <= 1999) return '90s Football Shirts';
  return 'Vintage Football Shirts';
}
const csv = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/\s+/g, ' ').trim() + '"';
const clip = (t, n) => (t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');

(async () => {
  const feedLinks = slugFromFeed();
  const shirts = (await loadShirts(argv)).filter((s) => s && s.id && !s.is_draft && s.available !== false);
  const header = ['Title', 'Media URL', 'Pinterest board', 'Thumbnail', 'Description', 'Link', 'Publish date', 'Keywords'];
  const rows = [header.join(',')];
  let pins = 0;
  shirts.forEach((s) => {
    const imgs = (Array.isArray(s.images) ? s.images : []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u.trim()));
    if (!imgs.length || !(parseFloat(s.price) > 0)) return;
    const link = feedLinks[s.id] || (SITE + '/?p=shop');
    const facts = [s.club, s.season && 'Season ' + String(s.season).replace(/^season\s*/i, ''),
      s.size && 'Size ' + s.size, s.category === 'match_worn' && (s.mw_type || 'Match worn'), s.mw_coa && 'with COA'].filter(Boolean);
    const base = String(s.title || '').trim();
    const kw = ['vintage football shirt', s.club, s.season, s.category === 'match_worn' && 'match worn shirt', 'original football shirt']
      .filter(Boolean).join(', ');
    const variants = [
      ['', 'Original ' + facts.join(' · ') + '. One of one, from Shirt Société.'],
      [' (photo 2)', 'More photos of this shirt. ' + facts.join(' · ') + '. One of one, from Shirt Société.'],
      [' (photo 3)', 'Another view of this shirt. ' + facts.join(' · ') + '. One of one, from Shirt Société.']
    ];
    imgs.slice(0, 3).forEach((im, i) => {
      rows.push([csv(clip(base + variants[i][0], 100)), csv(im), csv(board(s)), '', csv(clip(variants[i][1], 480)), csv(link), '', csv(kw)].join(','));
      pins++;
    });
  });
  const out = rows.join('\n') + '\n';
  if (argv.includes('--stdout')) { process.stdout.write(out); return; }
  fs.mkdirSync(path.join(__dirname, '..', 'social'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'social', 'pinterest-pins.csv'), out);
  console.log('Pinterest-pins: ' + pins + ' pins voor ' + shirts.length + ' shirts → social/pinterest-pins.csv');
})().catch((e) => { console.error('FOUT:', e.message); process.exit(1); });
