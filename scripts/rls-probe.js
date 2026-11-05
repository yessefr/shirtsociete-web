#!/usr/bin/env node
/*
 * Controleert of privacygevoelige Supabase-tabellen leesbaar zijn met alleen de
 * publieke (anon) sleutel. Telt rijen via HEAD-verzoeken; leest NOOIT gegevens
 * en schrijft niets. Exitcode 1 als een gevoelige tabel leesbaar is.
 *
 *   node scripts/rls-probe.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const admin = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');
const url = (admin.match(/url:\s*'(https:\/\/[a-z0-9]+\.supabase\.co)'/) || [])[1];
const key = (admin.match(/key:\s*'(eyJ[^']+)'/) || [])[1];
if (!url || !key) { console.error('Supabase-gegevens niet gevonden in admin.html'); process.exit(2); }

// gevoelig: nooit leesbaar zonder inloggen. publiek: bewust leesbaar (winkel).
const SENSITIVE = ['orders', 'drop_signups', 'customer_profiles', 'customer_wishlist', 'contact_messages', 'want_list', 'pos_sales', 'shirt_codes'];
const PUBLIC = ['shirts', 'my_collection', 'site_images'];

(async () => {
  let bad = 0;
  for (const t of [...SENSITIVE, ...PUBLIC]) {
    let line;
    try {
      const r = await fetch(`${url}/rest/v1/${t}?select=*`, { method: 'HEAD', headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'count=exact', Range: '0-0' } });
      const range = r.headers.get('content-range') || '';
      const rows = /\/(\d+)$/.exec(range) ? Number(/\/(\d+)$/.exec(range)[1]) : 0;
      const exposed = r.status === 200 && rows > 0;
      if (SENSITIVE.includes(t) && exposed) { bad++; line = `FOUT  ${t}: ${rows} rijen leesbaar zonder inloggen`; }
      else line = `ok    ${t}: ${r.status}${PUBLIC.includes(t) ? ' (publiek bedoeld, ' + rows + ' rijen)' : ''}`;
    } catch (e) { line = `?     ${t}: ${e.message}`; }
    console.log(line);
  }
  process.exit(bad ? 1 : 0);
})();
