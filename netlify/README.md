# Netlify-functies (versiebeheer)

Kopie van de serverfuncties van de live Netlify-site, overgenomen uit de repo `Shirtsociete2` (laatste wijziging 24-10-2026).
Doel: reviewen, testen en terug kunnen draaien. **Geen sleutels in deze map**: alle geheimen staan in Netlify onder Environment variables.

| Functie | Taak |
|---|---|
| create-payment, mollie-webhook | Betalen in de webshop (Mollie) |
| sumup | Kaartbetaling op beurzen (SumUp Solo, Kassa-tab) |
| contact | Contactformulier |
| validate-discount | Kortingscodes |
| drop-signup, drop-notify, drop-send | Collector List / drop-mails |
| customer-orders, admin-orders, admin-shirts | Klant- en beheerdata |
| instagram, meta-feed | Instagram-beelden, Meta-productfeed |

Gebruikte variabelen: ADMIN_EMAIL, DB_KEY, DB_SECRET, DB_URL, DROP_SECRET, IG_ACCESS_TOKEN, IG_CACHE_SECONDS, IG_USER_ID, MOLLIE_API_KEY, NOTIFY_EMAIL, RESEND_API_KEY, SUMUP_AFFILIATE_KEY, SUMUP_API_KEY, SUMUP_APP_ID, SUMUP_MERCHANT_CODE, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL.

`netlify.toml` en `package.json` staan hier in `netlify/` zodat GitHub Pages ze niet als site-bestanden serveert.
Netlify deployt nog steeds vanuit `Shirtsociete2`; wijzigingen moeten dus in beide repo's, of Netlify wordt later naar deze repo verplaatst (aparte stap, na akkoord van Yesse).
