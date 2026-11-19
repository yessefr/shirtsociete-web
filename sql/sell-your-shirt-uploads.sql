-- =====================================================================
-- Sell Your Shirt: foto's uploaden naar Supabase i.p.v. Cloudinary
-- =====================================================================
-- Dit bestand is VOORBEREID, NIET UITGEVOERD (AGENTS.md regel 5).
-- Voer het zelf uit in Supabase > SQL Editor VOORDAT de pull request
-- "Sell Your Shirt: uploads naar Supabase" wordt gemerged.
--
-- Wat het doet: de publieke sleutel mag bestanden TOEVOEGEN aan de map
-- submissions/ in de bucket shirt-photos. Niet lezen via de API, niet
-- verwijderen, niet overschrijven. Bestanden zijn alleen te openen met de
-- (onraadbare, willekeurige) link die in de mail aan jou komt.
-- Let op: de bucket shirt-photos is publiek (productfoto's), dus wie de link
-- heeft kan de foto zien. Dat is gelijk aan hoe Cloudinary werkte.

drop policy if exists "anon mag toevoegen aan submissions" on storage.objects;
create policy "anon mag toevoegen aan submissions"
on storage.objects for insert to anon
with check (bucket_id = 'shirt-photos' and name like 'submissions/%');

-- Controle (alleen lezen): moet precies deze policy tonen
select policyname, cmd, roles from pg_policies
where schemaname='storage' and tablename='objects' and policyname like '%submissions%';
