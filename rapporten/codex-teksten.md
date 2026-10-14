# Controle van Engelse teksten en beursgegevens

Onderzocht op 14 oktober 2026, op branch `codex/teksten`, vanaf `origin/main` (69ac87f). Alleen dit nieuwe rapport wordt toegevoegd; de vier HTML-bestanden blijven ongewijzigd.

## Uitgangspunten en dekking

- Er is geen AGENTS.md gevonden in de repository, elders onder /workspace of op /AGENTS.md. Er waren daarom geen aanvullende regels uit dat bestand om te volgen.
- Alle in de vier bestanden aanwezige Engelse paginacopy, metadata, formulierlabels, placeholders, toegankelijke labels en bezoekersmeldingen in inline JavaScript zijn onderzocht. Interne codecommentaren zijn geen bezoekerscopy; ze zijn alleen bekeken waar nodig voor datumgedrag.
- De opdracht geldt als bron voor de actuele beursstatus: STANDS Hamburg en Leipzig zijn geweest; Essen op **14 November 2026** is de volgende beurs. Bestaande historische datums: STANDS 26 September 2026; Leipzig 4 October 2026. Die historische dagen zijn consistent in de bron, maar niet extern bij de organisatoren geverifieerd.
- Regels zijn 1-gebaseerd en verwijzen naar de ongewijzigde bronbestanden. Suggesties hieronder zijn uitsluitend voorstellen. Taal = concreet taalprobleem; Onduidelijk/Consistentie = leesbaarheid of tegenstrijdigheid; Stijl = optioneel. Geen stilistische voorkeur als harde fout aangemerkt.
- Producttitels, beschrijvingen en captions die uitsluitend uit Supabase/Instagram worden geladen, zijn niet in deze vier bestanden aanwezig en vallen buiten deze broncontrole. Er zijn geen formulieren verstuurd en geen productiegegevens gewijzigd.

## Correcte beursvermeldingen

| Bestand en regels | Vaststelling |
| --- | --- |
| index.html:2703, 2708, 2713 | De evenementlijst bevat 26 September 2026 (STANDS Hamburg), 4 October 2026 (Leipzig) en 14 November 2026 (Essen), in chronologische volgorde. |
| index.html:4883–4884, 7665–7669 | Het Amsterdamse kalenderdagfilter sluit beide voorbije beurzen uit de toekomstige lijst; op de onderzoeksdatum is Essen de volgende beurs. |
| index.html:2864–2865, 3480–3485, 3898–3901, 4092–4095, 4320–4323, 4482–4484 | De volgende beurs staat al op Essen, 14 november 2026. Geen verkeerde kalenderdatum gevonden in deze aankondigingen. |
| index.html:3967, 3978, 4070–4084, 4423, 4430, 4470–4479, 7552, 7557 | STANDS en Leipzig staan in terugblikken/galerijen met historische datums en view impressions. Dit zijn geen foutieve toekomstige aankondigingen. |
| index.html:2706–2718, 2740–2748 | Takeover-teksten met today horen bij een specifieke beursdag; de datumselectie en expliciete preview maken ze geen huidige aankondiging voor STANDS/Leipzig. |
| shipping.html, sell-your-shirt.html, want-list.html | Geen beursdatums of aankondigingen gevonden. Last updated: 25 August 2026 in shipping.html:35 is een beleidsdatum en geen beursdatum. |

## Beursstatus en datums

| Bestand:regel(s) | Type | Huidige tekst / aanwijzing | Bevinding | Voorstel |
| --- | --- | --- | --- | --- |
| index.html:4144, 4352 | Beursstatus | >5< | De statistiek zegt 5 Fairs, terwijl de terugblik zes afzonderlijke evenementen bevat: Hamburg, Cologne, Düsseldorf, Frankfurt, STANDS Hamburg en Leipzig. | 6 events attended indien alle zes deelname waren; als alleen Vintage Fußballbörse wordt geteld, benoem die beperking expliciet. |
| index.html:4354 | Beursstatus | Hamburg to Essen | De toelichting bij de statistiek van bezochte beurzen wekt de indruk dat Essen al is geweest. Essen is volgens de opdracht pas op 14 november 2026. | Six events attended; next stop: Essen on 14 November 2026, met het getal afhankelijk van de gekozen telling. |
| index.html:4146, 4387 | Beursstatus | Hamburg, Cologne, Düsseldorf, Frankfurt | De terugblik telt steden en laat de tweede Hamburg-beurs STANDS onbenoemd. Dat is geen foute datum, maar verwarrend naast zes evenementkaarten en de statistiek 5. | We have attended six events, including STANDS Hamburg and the Leipzig fair; behoud de historische steden waar nuttig. |
| index.html:3459 | Beursstatus | 04-10-2026 | De prominente Leipzig-caption is historisch correct, maar heeft geen Past event/Highlights-label. Als hij zichtbaar wordt, kan hij als actuele beurs gelezen worden. | Highlights from Leipzig — 4 October 2026. Geen bewezen onjuiste toekomstige aankondiging. |
| index.html:4011, 4012, 4013, 4014, 4015 | Beursstatus | October | De maandkoppen van de desktop-tijdlijn hebben vijf kolommen voor zeven evenementen. September (STANDS) en November (Essen) ontbreken; July is nog benadrukt. | Gebruik zeven bijpassende kolommen: February, May, June, July, September, October, November; Essen als volgende beurs benadrukken. |
| index.html:4420 | Beursstatus | Hamburg STANDS Vintage Fußballbörse | Alt-tekst noemt STANDS tegelijk Vintage Fußballbörse, terwijl de evenementgegevens STANDS als eigen naam gebruiken. | STANDS Hamburg — 26 September 2026; neem de beursnaam uit de evenementgegevens over. |
| index.html:7671 | Beurstijd | T10:00:00+02:00 | De afteldatum gebruikt UTC+2 voor Essen op 14 november. Duitsland/Nederland gebruiken dan CET (UTC+1); de klok telt dus af naar 09:00 lokale tijd als 10:00 bedoeld is. | Europe/Berlin of de correcte wintertijd-offset gebruiken. De opgegeven datum 14 november blijft juist; 10:00 is alleen uit de code afgeleid en niet door de gebruiker bevestigd. |
| index.html:7705, 7755 | Beurstijd | 2026-07-04T17:00:00+02:00 | LIVE NOW-eindcontrole en timerstop verwijzen nog naar Frankfurt op 4 juli. Op 14 oktober stopt de timer na zijn eerste interval; op de beursdag kan de oude eindcontrole LIVE NOW niet activeren. | Koppel de eindtijd en het interval aan het volgende/huidige evenement, Essen op 14 november 2026. Openingstijden eerst bevestigen; dit rapport wijzigt geen code. |

## index.html — taal en duidelijkheid

| Bestand:regel(s) | Type | Huidige tekst / aanwijzing | Bevinding | Voorstel |
| --- | --- | --- | --- | --- |
| index.html:3274, 4264 | Taal | New Added | Onnatuurlijke Engelse formulering; in de footer staat dezelfde tekst met kleine letters. | New arrivals of Newly added. |
| index.html:2989, 3591 | Taal | First in, first served | De gebruikelijke uitdrukking voor deze verkoopvolgorde is first come, first served. | First come, first served. |
| index.html:4117, 4331 | Onduidelijk | From vintage clubs | Clubs zijn geen shirts; bovendien herhaalt match worn pieces worn het woord worn. | From vintage club shirts to shirts worn in matches by football legends … |
| index.html:3164, 3854 | Stijl | What drives us are beautiful football shirts | De constructie is begrijpelijk maar stroef. Dit is een optionele herschrijving, geen onbetwistbare grammaticafout. | Our passion is beautiful football shirts. |
| index.html:3164, 3854 | Onduidelijk | rare specs | Specs en personal grails zijn verzamelaarsjargon dat nieuwe bezoekers mogelijk niet begrijpen. | Rare editions and personal favourites, of geef een korte verklaring van het jargon. |
| index.html:4155 | Stijl | Where a shirt was worn | De lange onderwerpconstructie eindigt op is researched en leest zwaar; ook op mobiel (4363). | Before listing a shirt, we research where it was worn, who wore it and in which match. |
| index.html:54, 64, 73, 2795, 2796, 2906, 3401, 3893, 4564 | Consistentie | match worn | Samengestelde bijvoeglijke naamwoorden vóór shirts/piece staan meestal als match-worn; hetzelfde geldt voor match-issued en player-issued. Dit is een schrijfconventie, geen inhoudelijke fout. | Kies consequent match-worn shirts, match-issued shirts en player-issued shirts; wijzig zelfstandige classificatielabels alleen volgens de gekozen stijl. |
| index.html:3139, 3276, 4255 | Consistentie | Blog | Dezelfde sectie heet elders Journal (2834, 4579). | Kies één bezoekerslabel, bijvoorbeeld Journal. |
| index.html:3011, 3620 | Onduidelijk | National | Los filterlabel National is minder duidelijk dan National team shirts; elders staat International Shirts. | National team shirts, of consequent International shirts. |
| index.html:6159 | Onduidelijk | ['Club', shirt.club] | Het productlabel Club wordt ook gebruikt wanneer de waarde een nationaal team is. | Club or country. |
| index.html:3833 | Onduidelijk | Username | Het label vraagt een gebruikersnaam terwijl de placeholder Your name om een persoonsnaam vraagt. | Your name of Full name, afhankelijk van het bedoelde veld. |
| index.html:6627, 6628 | Onduidelijk | House Nr | Nr en Addition klinken als letterlijke Nederlandse vertalingen; bezoekers weten niet wat het tweede veld vraagt. | House number; Apartment, unit or suffix (optional). |
| index.html:6602 | Onduidelijk | (free shipping) | Vóór landkeuze toont de totaallabel free shipping bij een bestelling vanaf €150, terwijl niet-EU-bestemmingen wel verzendkosten krijgen. De toelichting is duidelijker dan het totaallabel. | Subtotal — shipping calculated at checkout zolang geen bestemming gekozen is; bevestig gratis verzending alleen voor toepasselijke EU-bestemmingen. |
| index.html:6744 | Onduidelijk | toFixed(2) + '+' | Een bedrag met alleen + maakt niet duidelijk welke kosten nog ontbreken. | Total excluding shipping, met Shipping calculated after you select a country. |
| index.html:10044 | Onduidelijk | Run supabase-klantaccounts.sql once | Een klant krijgt een technische installatieopdracht die hij niet kan uitvoeren; geen geschikte Engelse foutmelding voor een webshop. | We could not save your details. Please try again or contact us. |
| index.html:7425, 3777, 4557 | Consistentie | Removed from saved | Saved, My Wishlist en saved shirts verwijzen naar dezelfde functie, maar gebruiken verschillende namen. | Gebruik consequent Saved shirts; bijvoorbeeld Removed from your saved shirts. |
| index.html:6885, 8252, 8259, 9431, 9437 | Taal | Something went wrong, please try again | Twee zelfstandige zinnen verbonden met alleen een komma (comma splice). | Something went wrong. Please try again. |
| index.html:9304, 9307, 9495, 9498 | Stijl | Please email us directly | De volledige foutmelding mist eindinterpunctie; de overige formuliermeldingen gebruiken wel punten. | Something went wrong. Please email us directly at info@shirtsociete.com. |
| index.html:9989, 10028 | Consistentie | e-mail | Accountteksten gebruiken e-mail; de meeste overige teksten gebruiken email. Beide zijn correct, maar door elkaar is inconsistent. | Kies email voor aansluiting bij de rest van de site. |
| index.html:9990 | Onduidelijk | First to hear about new drops | Deze accountbelofte kan automatische nieuwsbriefinschrijving suggereren, terwijl regel 9994 alleen updates belooft if you ask en elders een aparte Collector List bestaat. | Early access to new drops when you join the Collector List; bevestig de werkelijke werking vóór een herschrijving. |
| index.html:3709, 6599, 6730 | Consistentie | over €150 | Over betekent strikt meer dan €150, maar de verzendberekening en shipping.html geven gratis verzending vanaf €150 inclusief. | Free shipping on EU orders of €150 or more; pas dezelfde formulering toe op alle equivalente labels. |
| index.html:3709 | Onduidelijk | delivery takes 3 to 7 | De producttekst noemt Nederland 3–7 werkdagen en internationaal 7–21; shipping.html:73 noemt 1–3 na verzending en 3–10. Geen eenduidige levertijdbelofte. | Stem de waarden af op het bevestigde beleid en vermeld telkens business days after dispatch; verwerkingstijd afzonderlijk. |
| index.html:4052, 4462, 7562 | Consistentie | Pop-up event | Düsseldorf heet op desktop en in de galerij Pop-up event, maar op mobiel Vintage Fußballbörse. De bedoelde organisator/naam is hierdoor niet eenduidig. | Gebruik de bevestigde officiële evenementnaam op alle drie plaatsen; de juiste naam is niet zelfstandig vastgesteld. |
| index.html:2865, 3480, 3481, 3482, 3483, 3484, 3485, 3920, 4322, 4387, 4482 | Stijl | 14 November 2026 | Engelse beursdatums wisselen tussen 14 Nov, 14/11/2026, 14.11.2026 en 14 November 2026; de gegenereerde zin laat het jaar ook weg (7682). De kalenderdag voor Essen is correct. | 14 November 2026 in volledige Engelse zinnen; 14 Nov 2026 voor compacte labels. Historische datums eveneens met een maandnaam waar ruimte is. |

## shipping.html

| Bestand:regel(s) | Type | Huidige tekst / aanwijzing | Bevinding | Voorstel |
| --- | --- | --- | --- | --- |
| shipping.html:46, 52 | Consistentie | Free shipping over | Koppen zeggen over €150; regel 47 zegt terecht €150 or more. Bij precies €150 is de huidige tekst tegenstrijdig. | Free shipping on orders of €150 or more; kolomkop Free from €150. |
| shipping.html:52, 53, 54, 56, 73 | Onduidelijk | Days | Days zegt niet of het werkdagen zijn en of verwerking inbegrepen is. Nederland staat op 1–2 in de tabel versus 1–3 in de tekst; België en Luxemburg op 2 versus other destinations 3–10. | Estimated business days after dispatch; maak tabel en alinea numeriek consistent op basis van bevestigde levertijden. |
| shipping.html:43 | Onduidelijk | it is followed end to end | Followed end to end is begrijpelijk maar minder natuurlijk dan tracked throughout. Through the door kan klinken alsof het pakket een deur passeert in plaats van de brievenbus. | In the Netherlands, shirts are sent as tracked letterbox parcels, delivered through your letterbox without requiring you to be at home. |
| shipping.html:44 | Onduidelijk | at no extra cost to you | De tekst belooft bij orders boven €500 gratis verzekering, maar zegt dat dekking tot €500 gaat en aanvullende dekking nog moet worden afgesproken. Onduidelijk wie de extra premie betaalt en hoe volledige dekking is geregeld. | Maak expliciet wie aanvullende verzekering betaalt en tot welk bedrag de order gedekt is; geen verzekeringsbelofte invullen zonder bevestigd beleid. |
| shipping.html:82 | Onduidelijk | resolve it | It verwijst niet duidelijk naar packages/meervoud of naar the issue. Replacement kan bij unieke shirts bovendien geen identieke vervanging betekenen. | For parcels lost in transit, we will work with you and the carrier to resolve the issue. Verduidelijk an alternative replacement or a refund indien dat het beleid is. |

## sell-your-shirt.html

| Bestand:regel(s) | Type | Huidige tekst / aanwijzing | Bevinding | Voorstel |
| --- | --- | --- | --- | --- |
| sell-your-shirt.html:6, 7, 11, 12, 22, 77, 83, 117 | Consistentie | match worn | Dezelfde schrijfconventie als index.html ontbreekt bij match worn football shirts en player issue shirts. | Match-worn football shirts en player-issued shirts wanneer de woorden bijvoeglijk vóór shirts staan. |
| sell-your-shirt.html:82 | Taal | roughly 1970s through early 2000s | De periode mist natuurlijke lidwoorden en een vanaf-constructie. | Club and national team shirts from roughly the 1970s to the early 2000s. |
| sell-your-shirt.html:81 | Onduidelijk | replicas of recent seasons | Replica is in voetbalverkoop ook een legitiem origineel fanshirt. Zonder definitie kan original shirts only botsen met het onderscheid vintage/retail. | Omschrijf expliciet of contemporary retail shirts, reproductions of older designs of counterfeit shirts worden uitgesloten; geen nieuw inkoopbeleid verzinnen. |
| sell-your-shirt.html:91 | Onduidelijk | arrange tracked, insured shipping | Niet duidelijk wie het verzendlabel levert, betaalt en de verzekering afsluit bij inkoop. We agree a price is geldig Brits Engels, dus geen grammaticafout. | Once we agree on a price, we arrange tracked, insured shipping; voeg het bevestigde beleid voor label/kosten toe. |
| sell-your-shirt.html:98, 99, 102, 214 | Onduidelijk | Your name | Naam, email en club/country zijn verplicht volgens de formuliercontrole, maar de labels tonen geen Required of *. Andere velden zijn slechts deels optional gemarkeerd. | Markeer alle verplichte velden consequent; vermeld dat overige velden optioneel zijn. |
| sell-your-shirt.html:147 | Onduidelijk | nameset | Nameset is verzamelaarsjargon en Where it came from is ruim interpreteerbaar. | Its history, any flaws, player name and number printing, and certificates … |
| sell-your-shirt.html:242 | Onduidelijk | photo(s) | Photo(s) is technisch ogende meervoudsnotatie; de tekst zegt You can still send terwijl het script direct doorgaat met verzenden (243 en verder). | One photo could not be uploaded / X photos could not be uploaded. We will send your submission without these photos; please reply to our email with them, als dat de bedoelde werking blijft. |
| sell-your-shirt.html:259, 261 | Stijl | Please email us at | De foutmeldingen missen een afsluitende punt; succes- en validatiemeldingen gebruiken die wel. | Something went wrong. Please email us at info@shirtsociete.com. |

## want-list.html

| Bestand:regel(s) | Type | Huidige tekst / aanwijzing | Bevinding | Voorstel |
| --- | --- | --- | --- | --- |
| want-list.html:7, 12, 98, 100, 101 | Consistentie | Match worn | Match worn/issued-classificaties zijn begrijpelijk voor kenners, maar niet consequent geschreven of uitgelegd. | Gebruik de gekozen match-worn/match-issued schrijfwijze en leg het onderscheid kort uit voor nieuwe verzamelaars. |
| want-list.html:72 | Onduidelijk | something matching | Something matching komt minder natuurlijk over dan a matching shirt; single piece kan betekenen één kledingstuk in plaats van één beschikbaar exemplaar. | We usually have only one of each shirt. Tell us what you are looking for, and we will contact you when a matching shirt arrives, usually before it is listed. |
| want-list.html:78 | Onduidelijk | you hear about it first | Dit klinkt als gegarandeerde exclusieve voorrang voor iedere aanvraag. De inleiding belooft slechts usually before it goes on the site. | We will email you when we find a shirt that matches your request. Benoem vroege toegang alleen als die gegarandeerd kan worden. |
| want-list.html:86, 89, 93, 94, 161 | Onduidelijk | Season or era | Email en club/country zijn verplicht in de controle, season/era en size optioneel. Alleen enkele optionele velden zijn als zodanig aangeduid. | Markeer Email en Club or country als Required en label Season or era en Size als optional. |
| want-list.html:105 | Onduidelijk | long sleeve | Als losse formulierhint begrijpelijk, maar nameset is jargon en een long sleeve is op zichzelf een mouw. | Home or away shirt, long or short sleeves, player name and number printing, tournament … |
| want-list.html:186, 188 | Stijl | Please email us at | De foutmeldingen missen afsluitende interpunctie. | Something went wrong. Please email us at info@shirtsociete.com. |
| want-list.html:191 | Consistentie | btn.textContent = 'Send' | Na een fout verandert de knop van Send request (107) naar Send. Geen grammaticafout, wel een onverwachte labelwisseling. | Gebruik consequent Send request. |

## Prioriteit

1. Corrigeer in een aparte wijziging de tegenstrijdige levertijden, inclusieve €150-grens, beursstatistieken en de onjuiste novembertijdzone/juli-einddatum van de aftelklok.
2. Verbeter concrete formuleringen zoals New Added en de klantmelding over het uitvoeren van SQL; maak verplichte velden en adresvelden duidelijk.
3. Stem terminologie, datumweergave en optionele stijlverbeteringen af. Betalings-, verzend-, verzekerings- en voorrangsbeleid moeten bevestigd worden voordat nieuwe beloftes worden geschreven.

Dit rapport bevat 52 afzonderlijke bevindingen. Er zijn geen wijzigingen of runtimefixes aan de site uitgevoerd.
