// Live product feed for Instagram / Facebook Shops (Meta Commerce Manager).
// Meta fetches this address on a schedule, so new shirts appear and sold
// shirts disappear without anyone regenerating a file.
//
//   https://shirtsociete.netlify.app/.netlify/functions/meta-feed
//
// Read-only. Concepts (is_draft) and sold shirts are never included. The
// database key stays in Netlify and is never sent out.

const BASE = 'https://shirtsociete.com';

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// same slug rules as the product pages, so every feed link opens a real page
function slug(s) {
  let parts = s.title || 'shirt';
  if (s.size
      && !new RegExp('\\bsize\\s*' + s.size + '\\b', 'i').test(parts)
      && !new RegExp('\\b' + s.size + '\\b', 'i').test(parts.replace(/\d{4}/g, ''))) {
    parts += ' size ' + s.size;
  }
  let out = parts.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (out.length > 90) {
    out = out.slice(0, 90);
    const cut = out.lastIndexOf('-');
    if (cut > 40) out = out.slice(0, cut);
  }
  return out;
}

function buildFeed(shirts) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
  lines.push('  <channel>');
  lines.push('    <title>Shirt Société</title>');
  lines.push('    <link>' + BASE + '/</link>');
  lines.push('    <description>Vintage and match worn football shirts</description>');
  const tag = (n, v) => '      <' + n + '>' + esc(v) + '</' + n + '>';
  let included = 0;

  shirts.forEach(function (s) {
    if (!s || !s.id) return;
    if (s.is_draft) return;                    // concept: not public
    if (s.available === false) return;         // sold
    // only photos that load: the old Cloudinary account is gone
    const imgs = (Array.isArray(s.images) ? s.images : []).filter(function (u) {
      return u && /^https?:\/\//.test(u) && !/res\.cloudinary\.com/.test(u) && !/\.(mp4|mov|webm|m4v)(\?|$)/i.test(u);
    });
    if (!imgs.length) return;
    const price = parseFloat(s.price);
    if (!price || isNaN(price)) return;

    const desc = s.description
      ? String(s.description).replace(/\s+/g, ' ').trim()
      : (s.title + '. A single, original piece from Shirt Société.');
    const ptype = s.category === 'match_worn' ? 'Match Worn / Issued'
                : s.category === 'national' ? 'International Shirts' : 'Club Shirts';

    lines.push('    <item>');
    lines.push(tag('g:id', s.id));
    lines.push(tag('g:title', (s.title || 'Football shirt').slice(0, 150)));
    lines.push(tag('g:description', desc.slice(0, 9000)));
    lines.push(tag('g:link', BASE + '/products/' + slug(s) + '.html'));
    lines.push(tag('g:image_link', imgs[0]));
    imgs.slice(1, 11).forEach(function (u) { lines.push(tag('g:additional_image_link', u)); });
    lines.push(tag('g:availability', 'in stock'));
    lines.push(tag('g:price', price.toFixed(2) + ' EUR'));
    lines.push(tag('g:condition', 'used'));
    lines.push(tag('g:brand', s.club || 'Shirt Société'));
    lines.push(tag('g:quantity_to_sell_on_facebook', '1'));
    lines.push(tag('g:product_type', ptype));
    lines.push(tag('g:google_product_category', '212'));
    lines.push(tag('g:age_group', 'adult'));
    lines.push(tag('g:gender', 'unisex'));
    if (s.size) lines.push(tag('g:size', s.size));
    lines.push('    </item>');
    included++;
  });

  lines.push('  </channel>');
  lines.push('</rss>');
  return { xml: lines.join('\n'), count: included };
}

exports.handler = async function () {
  const url = process.env.DB_URL || process.env.SUPABASE_URL;
  const key = process.env.DB_SECRET || process.env.SUPABASE_SERVICE_KEY || process.env.DB_KEY;
  if (!url || !key) {
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'Feed is not configured.' };
  }
  try {
    const r = await fetch(url + '/rest/v1/shirts?select=id,title,club,category,season,size,price,description,images,is_draft,available&limit=1000', {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    if (!r.ok) throw new Error('database ' + r.status);
    const shirts = await r.json();
    const out = buildFeed(shirts);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
        'X-Items': String(out.count)
      },
      body: out.xml
    };
  } catch (e) {
    return { statusCode: 502, headers: { 'Content-Type': 'text/plain' }, body: 'Feed temporarily unavailable.' };
  }
};

exports.buildFeed = buildFeed;
