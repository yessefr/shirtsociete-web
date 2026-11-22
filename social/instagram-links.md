# Instagram: links naar het shirt zelf

Doel: elke post of story eindigt op de pagina van het shirt, niet op de voorpagina. De 118 Organic Social-sessies (GA4, 28 dagen) hadden 0 key events en 21 s betrokkenheid.

## Regels
1. **Link in bio** (vervang de voorpagina): `https://shirtsociete.com/?p=shop&sort=new&utm_source=instagram&utm_medium=social&utm_campaign=bio` (toont de nieuwste shirts).
2. **Per post of story**: pak de regel van het shirt uit `instagram-links.csv` (alle 56 shirts uit de feed, met UTM). Gebruik een link-sticker in stories en zet in de caption "Link in bio: tik op het shirt in de nieuwste lijst" of een korte link (bijv. via Linktree/Bitly) als je geen sticker hebt.
3. Zet in de caption altijd: maat, prijs en "Free shipping tracked from NL" alleen als dat klopt (zie shipping.html), plus één zin over staat van het shirt.
4. Verkocht shirt? Verwijder de regel uit je planning; de productpagina verdwijnt bij de nachtelijke verversing.
5. Meten: in GA4 onder Acquisition > Traffic acquisition, filter `Session source = instagram`; per shirt via `utm_content`.

## Wat jij zelf moet doen
- De bio-link in Instagram aanpassen (kan ik niet vanaf hier).
