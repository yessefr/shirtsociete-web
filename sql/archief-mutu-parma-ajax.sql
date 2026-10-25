-- Archief: drie nieuwe stukken. Voer uit in Supabase (SQL Editor) NA controle.
-- Daarna: Admin > Archive > "Manage photos" bij elk stuk en upload de foto's
-- (Parma: 2 foto's, Mutu: 1 achterkant, Ajax-jack: 2 foto's).
-- Alleen kolommen die de site zeker gebruikt; niets wordt overschreven of gewist.
-- Controleer of de stukken al bestaan voor je dit draait.

insert into my_collection (title, club, season, description, mw_type, mw_player)
select * from (values
  ('Mutu Parma 2002/03 home long sleeve match worn #20',
   'Parma', '2002/03',
   'Parma home shirt, long sleeve, from the 2002/03 Serie A season, made by Champion with the Parmalat sponsor. Printed MUTU and number 20 on the back, with the Serie A badge on the sleeve and the 1913-2003 club 90th anniversary patch. The heavy wear on the number print shows this shirt was used in matches.',
   'Match worn', 'Adrian Mutu'),
  ('Parma 2002/03 home long sleeve Champion Parmalat',
   'Parma', '2002/03',
   'Parma home shirt, long sleeve, 2002/03, by Champion with the Parmalat sponsor, Serie A badge and the club 90th anniversary patch on the sleeve. Shown here from the front, the companion to the Mutu match worn shirt.',
   null, null),
  ('Ajax Kappa TDK training jacket 1987',
   'Ajax', '1987',
   'Ajax Kappa track jacket from 1987 in red with white and blue panels and the Kappa Omini sleeve tape. The Ajax crest is on the chest and TDK, the sponsor of the time, is printed on the back.',
   null, null)
) as v(title, club, season, description, mw_type, mw_player)
where not exists (select 1 from my_collection m where m.title = v.title);
