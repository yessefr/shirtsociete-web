'use strict';
/*
 * Gedeelde bron voor scripts die shirts nodig hebben (alleen lezen, publieke anon-sleutel,
 * dezelfde als in index.html; geen geheim). Met --fixture bestand.json werkt het zonder netwerk.
 */
const fs = require('fs');
const DB_HOST = process.env.SS_DB_HOST || 'https://hzwmjbsfmdkmaoikezoc.supabase.co';
const DB_KEY = process.env.SS_DB_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21qYnNmbWRrbWFvaWtlem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTczNDIsImV4cCI6MjA5MzEzMzM0Mn0.5-ToRrtP3bhkN_qmSMmLM5YXQgE5kWoE0wVpsksqIMs';

async function loadShirts(argv) {
  const i = argv.indexOf('--fixture');
  if (i > -1) return JSON.parse(fs.readFileSync(argv[i + 1], 'utf8')).shirts;
  const res = await fetch(DB_HOST + '/rest/v1/shirts?select=*&order=created_at.desc&limit=2000',
    { headers: { apikey: DB_KEY, Authorization: 'Bearer ' + DB_KEY } });
  if (!res.ok) throw new Error('shirts: HTTP ' + res.status);
  return res.json();
}
module.exports = { loadShirts };
