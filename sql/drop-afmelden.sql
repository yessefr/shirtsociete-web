-- Afmelden voor de Collector List (voorbereid door Claude, NIET zelf uitgevoerd).
-- Draai dit in Supabase > SQL Editor VOOR je de nieuwe drop-send / drop-unsubscribe functies deployt.
-- Er wordt niets gewist: een afmelding zet alleen een tijdstip, zodat iemand niet per ongeluk opnieuw gemaild wordt.

alter table public.drop_signups
  add column if not exists unsubscribed_at timestamptz;

-- Controle (mag je draaien): toont aantal actieve en afgemelde adressen
select count(*) filter (where unsubscribed_at is null) as actief,
       count(*) filter (where unsubscribed_at is not null) as afgemeld
from public.drop_signups;
