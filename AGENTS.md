# AGENTS.md: spelregels voor alle AI-agents (Claude, ChatGPT/Codex)

Dit bestand lezen alle agents eerst. Het project is **Shirt Société** (shirtsociete.com), een webshop voor vintage en match worn voetbalshirts. Eigenaar: Yesse. Taal van overleg: **Nederlands**. Teksten op de site: **Engels**.

## Hoe de site in elkaar zit
- Statische site op GitHub Pages: `index.html` (groot, alle CSS en JS erin), `admin.html`, `blog.html` en losse pagina's (`sell-your-shirt.html`, `want-list.html`, `shipping.html`, ...).
- Gegenereerde pagina's (`products/`, `collections/`, journal, sitemap) komen uit de admin-generator in `admin.html`. **Pas gegenereerde bestanden niet met de hand aan**; pas de generator aan.
- Database en opslag: Supabase (tabellen `shirts`, `my_collection`, `site_images`, `customer_*`, `pos_sales`). Foto's en video's in de bucket `shirt-photos`. **Geen Cloudinary meer.**
- Serverfuncties: `netlify/functions/` (bijvoorbeeld `sumup.js`, `instagram.js`).
- Betalen: Mollie (webshop), SumUp Solo (beurzen, via de Kassa-tab in de admin).

## Harde regels
1. **Nooit rechtstreeks naar `main` schrijven.** Werk op een eigen branch (`claude/<onderwerp>` of `codex/<onderwerp>`) en maak een pull request. Yesse keurt goed.
2. **Geen geheimen in de repo**: geen API-sleutels, tokens of wachtwoorden. Die staan in Netlify (Environment variables).
3. **Eén agent per bestand tegelijk.** Controleer open pull requests voor je begint aan `index.html` of `admin.html`. Zijn die al in bewerking? Kies een andere taak.
4. **Klein en terug te draaien.** Eén onderwerp per pull request. Beschrijf wat er veranderd is en hoe je het getest hebt.
5. **Niets wissen** van klantgegevens, bestellingen of shirts. SQL-bestanden bouw je voor, je voert ze niet zelf uit.
6. **Geen valse claims** op de site (reviews, aantallen, certificaten) die niet kloppen.

## Controle voor elke pull request
- JavaScript: elk `<script>` (zonder `ld+json`) moet syntactisch kloppen (`node --check`).
- HTML: aantal `<div` en `</div>` moet gelijk zijn in het gewijzigde bestand.
- Houd mobiel (smal scherm) en laptop beide in de gaten, en light en dark mode.
- Staat er een kaart of pagina met teksten over beurzen? Controleer data: Leipzig (04-10-2026) en STANDS Hamburg (26-09-2026) zijn geweest; volgende is **Essen, 14-11-2026**.

## Wie doet wat (agents)
| Agent | Taak | Voorstel |
|---|---|---|
| Claude (bouwer) | Wijzigingen in `index.html`, `admin.html`, functies, SQL | Pull request |
| ChatGPT / Codex (uitvoerder en controleur) | Taken met label `codex`, review van pull requests van Claude, teksten | Pull request of review-commentaar |
| Controle-agent (dagelijks) | Kapotte links/afbeeldingen/formulieren melden | Issue met label `controle` |
| SEO-agent (wekelijks) | Titels, beschrijvingen, sitemap, structuur nalopen | Issue of pull request |
| Tekst-agent | Concepten voor shirtteksten, Journal en Collector List-mail | Pull request met conceptbestanden |
| Gegevens-agent | Controle van shirtlijst en foto's | Rapport als issue |

## Taken verdelen
Taken staan als **GitHub Issues**. Label `claude` of `codex` bepaalt wie begint. Labels `klaar-voor-review` en `wacht-op-yesse` tonen de status.
