-- Archief: twee nieuwe stukken. Voer uit in Supabase (SQL Editor) NA controle.
-- Daarna: Admin > Archive > "Manage photos" bij elk stuk en upload de foto's
-- (Mutu-shirt: voor- en achterkant, Ajax-jack: voor- en achterkant).
-- Alleen kolommen die de site zeker gebruikt; niets wordt overschreven of gewist.
-- Controleer of de stukken al bestaan voor je dit draait.

insert into my_collection (title, club, season, description, mw_type, mw_player)
select * from (values
  ('Mutu Parma 2002/03 home long sleeve match worn #20',
   'Parma', '2002/03',
   'Parma home shirt, long sleeve, from the 2002/03 Serie A season, made by Champion with the Parmalat sponsor. Printed MUTU and number 20 on the back, with the Serie A badge and the 1913-2003 club 90th anniversary patch on the sleeves. The heavy wear on the number print shows this shirt was used in matches.',
   'Match worn', 'Adrian Mutu'),
  ('Ajax Kappa TDK training jacket 1987',
   'Ajax', '1987',
   'Ajax Kappa track jacket from 1987 in red with white and blue panels and the Kappa Omini sleeve tape. The Ajax crest is on the chest and TDK, the sponsor of the time, is printed on the back.',
   null, null)
) as v(title, club, season, description, mw_type, mw_player)
where not exists (select 1 from my_collection m where m.title = v.title);
