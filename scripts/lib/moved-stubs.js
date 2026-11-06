'use strict';
/*
 * Verouderde gegenereerde pagina's (oude naam na een titelwijziging, verkocht en verwijderd,
 * oude kopie in clubs/clubs/) worden nooit meer door de generator geschreven. Ze blijven dan
 * staan met oude, soms kapotte foto's (Cloudinary) en dubbele inhoud. Deze module vervangt
 * zo'n pagina door een klein doorverwijsbestand naar de actuele pagina. Er wordt niets gewist:
 * de URL blijft bestaan, dus oude links, Google en Pinterest komen op de juiste plek uit.
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://shirtsociete.com';
const MARK = '<!-- ss-moved -->';
const SECTIONS = ['clubs', 'collections', 'national-teams'];

const idOf = (html) => { const m = /encodeURIComponent\("([a-f0-9-]{8,})"\)/.exec(html); return m ? m[1] : null; };

function stub(target) {
  const url = SITE + target;
  return `<!doctype html>
${MARK}
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Moved | Shirt Société</title>
<link rel="canonical" href="${url}">
<meta http-equiv="refresh" content="0;url=${target}">
</head><body>
<p>This page has moved. <a href="${target}">Continue to Shirt Société</a>.</p>
<script>location.replace(${JSON.stringify(target)});</script>
</body></html>
`;
}

// files: { 'products/x.html': '<html…' } van deze run. Geeft { 'pad': 'stub-html' } terug.
function planStubs(root, files) {
  const fresh = new Set(Object.keys(files));
  const idToPage = {};
  for (const [p, html] of Object.entries(files)) {
    if (/^products\/[^/]+\.html$/.test(p) && p !== 'products/index.html') { const id = idOf(String(html)); if (id) idToPage[id] = '/' + p; }
  }
  const out = {};
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
    });
  };
  const candidates = [].concat(walk(path.join(root, 'products')), ...SECTIONS.map((s) => walk(path.join(root, s))));
  for (const abs of candidates) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    if (fresh.has(rel) || rel === 'products/index.html') continue;
    const old = fs.readFileSync(abs, 'utf8');
    let target = null;
    if (rel.startsWith('products/')) {
      const id = idOf(old);
      const canon = /<link[^>]+rel="canonical"[^>]+href="https:\/\/shirtsociete\.com(\/products\/archive\/[^"]+)"/.exec(old);
      target = (id && idToPage[id]) || (canon && fresh.has(canon[1].slice(1)) ? canon[1] : '/sold-football-shirts/');
    } else {
      const m = /^([^/]+)\/\1\/(.*)$/.exec(rel);            // clubs/clubs/ajax/index.html → clubs/ajax/index.html
      if (m && fresh.has(m[1] + '/' + m[2])) target = '/' + (m[2].endsWith('index.html') ? m[1] + '/' + m[2].slice(0, -'index.html'.length) : m[1] + '/' + m[2]);
      else if (m) target = '/' + m[1] + '/';
    }
    if (!target) continue;                                    // onbekend: niet aanraken
    const html = stub(target);
    if (old === html) continue;
    out[rel] = html;
  }
  return out;
}

module.exports = { planStubs, stub, idOf, MARK };
