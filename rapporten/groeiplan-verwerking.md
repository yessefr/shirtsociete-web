# Verwerking van het audit- en groeiplan (november 2026)

Bron: *Shirt Société, website audit, groeiplan & automatiseringsstrategie* (PDF, november 2026).
Dit bestand zegt per punt: gedaan, wie pakt het op, of wat Yesse moet doen. Bijgewerkt: 7 november 2026.

## Al gedaan (eerder en in deze ronde)
| Punt uit het plan | Stand |
|---|---|
| Pinterest Business, domein claimen, catalogus koppelen | Gedaan (site geclaimd, catalogus met 48 producten) |
| Pinterest Tag | Staat op de site (alleen na marketingtoestemming) |
| Productcatalogus/feed met prijs, voorraad, condition=used | `products.xml` en `pinterest.xml`, nachtelijk ververst; verkocht valt eruit; geen GTIN |
| UTM-tags op Pinterest-verkeer | `pinterest.xml` (g:ads_redirect) |
| Supabase RLS voor klanten/orders/want list | Dicht en gecontroleerd (PR #72, SQL door Yesse) |
| Sold Archive | Bestaat (`sold-football-shirts/`), verkochte pagina's blijven online als Sold |
| Security: service-role niet in de browser | Gecontroleerd, alleen server-side (Netlify) |
| Netlify-functies in versiebeheer | `netlify/functions/` (kopie uit Shirtsociete2) |
| Telefoon-stijl (kaarten, cart, checkout, saved) | PR #77, #81, #83 |

## Nieuw in deze ronde (code klaar)
| Agent uit het plan | Wat het nu doet |
|---|---|
| 1. Catalog QA | `scripts/catalog-qa.js` + wekelijkse workflow: controleert maat, prijs, foto's, titel, beschrijving, seizoen, mw_type. Houdt één issue bij. Beoordeelt nooit echtheid. |
| 6. Content Repurposing (Pinterest) | `scripts/pinterest-pins.js` maakt `social/pinterest-pins.csv` (pin-concepten voor bulk-upload, nachtelijk). Niets wordt automatisch geplaatst. Teksten gebruiken alleen databasevelden. |

## Bevindingen uit de code-review (Netlify, niet in main gedeployed)
Mollie-webhook (`netlify/functions/mollie-webhook.js`):
- Goed: de status wordt server-side bij Mollie opgehaald; een order wordt alleen "paid" bij `payment.status === 'paid'`.
- Verbeterpunt 1: bij elke fout antwoordt de functie toch 200. Mislukt dan een database-update, dan probeert Mollie niet opnieuw en blijft een betaalde order op "pending". Beter: 500 bij tijdelijke fouten.
- Verbeterpunt 2: klantgegevens (naam, adres, opmerkingen) staan ongefilterd in de e-mail-HTML. Moet worden ge-escaped.
- Verbeterpunt 3: er wordt niet gecontroleerd of het betaalde bedrag gelijk is aan `order.total`.
- Verbeterpunt 4: twee gelijktijdige webhook-aanroepen kunnen klantomzet dubbel tellen. Gebruik een voorwaardelijke update (`status = 'pending'`).
Netlify deployt uit de repo `Shirtsociete2`; een fix moet daar (of na verhuizen) worden gedaan. Zie issue.

## Wie doet wat
| Punt | Wie |
|---|---|
| Webhook-fixes, Want List Matching Agent (ontwerp + SQL, jij voert SQL uit), Sold workflow, clubhubs in de generator, cross-sell/gift card, Shirt Passport-ID (SS-MW-xxxx) en QR | **Claude** |
| Teksten: clubhub-introducties, Journal-guides (authenticity, sizing, match worn, labels), Duitse pagina's, Pinterest-boardbeschrijvingen, aanmeldmails aan aggregators, privacybeleid-concept, PR-review van Claude-werk | **ChatGPT / Codex** (labels `codex`, `klaar-voor-review`) |
| Aanmelden bij Get the Jersey, FindYourJersey, Kit Finder; Cloudflare voor security headers; bewaartermijnen kiezen; pins uploaden; Mollie-dashboard controleren | **Yesse** (label `wacht-op-yesse`) |

## Bewust niet gedaan
- Geen claims over echtheid/herkomst automatiseren (guardrail uit het plan): QA meldt alleen ontbrekende velden.
- Niets automatisch posten naar Pinterest of aggregators.
- Retro-reproducties/mystery boxes: staat in het plan als "niet doen".
