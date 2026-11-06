-- =====================================================================
-- Beveiliging: orders en drop_signups waren leesbaar met de publieke sleutel
-- =====================================================================
-- Gevonden in de audit van 2026-11-04: met alleen de publieke (anon) sleutel,
-- die in admin.html en index.html staat, gaf Supabase rijen terug uit
--   orders        (12 rijen)
--   drop_signups  (24 rijen, e-mailadressen)
-- De winkel zelf leest deze tabellen nergens; alleen de admin (ingelogd als
-- jij) en de Netlify-functies (service-sleutel, omzeilt RLS) gebruiken ze.
-- Strenger maken breekt dus niets, mits de punten bij STAP 3 kloppen.
--
-- Dit bestand is VOORBEREID, NIET UITGEVOERD (AGENTS.md regel 5).
-- Voer het zelf uit in Supabase > SQL Editor, stap voor stap.
-- Na afloop:  node scripts/rls-probe.js  moet overal "ok" geven.
-- =====================================================================

-- STAP 1: kijk eerst welke policies er nu staan (alleen lezen)
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where tablename in ('orders','drop_signups','customer_profiles','customer_wishlist','contact_messages','want_list','shirt_codes')
order by tablename, policyname;

-- STAP 2: zet RLS aan en haal policies weg die anon toegang geven
alter table public.orders        enable row level security;
alter table public.drop_signups  enable row level security;

-- Pas de namen aan op wat STAP 1 liet zien. Voorbeelden van typische fouten:
--   using (true)  /  roles {public} of {anon}  voor select/update/delete.
-- drop policy if exists "<naam uit stap 1>" on public.orders;
-- drop policy if exists "<naam uit stap 1>" on public.drop_signups;

-- STAP 3: alleen jij (ingelogd met je admin-adres) mag lezen en wijzigen.
-- Zet hier hetzelfde adres als ADMIN_EMAILS in admin.html.
create policy "admin leest orders" on public.orders
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'yessefredriks2@gmail.com');
create policy "admin wijzigt orders" on public.orders
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'yessefredriks2@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'yessefredriks2@gmail.com');

create policy "admin leest aanmeldingen" on public.drop_signups
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'yessefredriks2@gmail.com');
create policy "admin wijzigt aanmeldingen" on public.drop_signups
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'yessefredriks2@gmail.com');

-- Geen insert-policy voor anon: nieuwe orders en aanmeldingen komen binnen via
-- de Netlify-functies (create-payment, drop-signup) met de service-sleutel.
-- Controleer dat voordat je dit uitvoert: schrijft een formulier ooit direct
-- naar /rest/v1/orders of /rest/v1/drop_signups? In deze repo niet (zie audit).

-- STAP 4: testen
--   1. node scripts/rls-probe.js            (anon: orders en drop_signups moeten dicht zijn)
--   2. Admin openen: bestellingen en aanmeldingen moeten nog zichtbaar zijn.
--   3. Testaanmelding op de site: komt binnen? (loopt via Netlify)
