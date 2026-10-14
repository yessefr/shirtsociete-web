# Eerste controle van index.html

Onderzocht op 14 oktober 2026. Alleen onderzoek; index.html en andere bestaande repositorybestanden zijn niet aangepast. Regels verwijzen naar de onderzochte index.html.

## Werkwijze en beperkingen

Er is geen AGENTS.md gevonden in /workspace, de repository of /AGENTS.md. Statische HTML-attributen zijn geparseerd; daarnaast zijn alle `<img>`-declaraties in JavaScript-sjablonen onderzocht. Cloudinary-adressen uit letterlijke href/src-attributen zijn met een HTTPS HEAD-verzoek gecontroleerd, met TLS-verificatie aan. Dynamisch opgebouwde adressen en databasegegevens kunnen niet volledig statisch worden gevalideerd. Geen formulieren, betalingen of beheeracties uitgevoerd.

## 1. Lege of verdachte href/src-attributen

| Regel | Attribuut/onderdeel | Bevinding |
| --- | --- | --- |
| 3043 | `img src=""` | Lege bron; bij deze detail-/lightboxafbeelding vult JavaScript de src later in (regels 6049, 6071, 6295, 7322, 7627). Bewuste placeholder, geen bewezen kapotte externe URL. |
| 3683 | `img src=""` | Lege bron; bij deze detail-/lightboxafbeelding vult JavaScript de src later in (regels 6049, 6071, 6295, 7322, 7627). Bewuste placeholder, geen bewezen kapotte externe URL. |
| 4073 | `href="#"` | Bewuste actieknop: `event.preventDefault();openEventGallery('stands')`. Standaardnavigatie wordt voorkomen; geen onverklaarde #-link. |
| 4084 | `href="#"` | Bewuste actieknop: `event.preventDefault();openEventGallery('leipzig')`. Standaardnavigatie wordt voorkomen; geen onverklaarde #-link. |
| 4195 | `href="/contact.html"` | Lokaal doel ontbreekt in de checkout. Controleer runtimegedrag/fallback; een klikfunctie kan gewone navigatie onderscheppen. |
| 4275 | `href="#"` | Bewuste actieknop: `ssOpenCookieSettings();return false;`. Standaardnavigatie wordt voorkomen; geen onverklaarde #-link. |
| 4280 | `href="#"` | Bewuste actieknop: `openContactModal();return false;`. Standaardnavigatie wordt voorkomen; geen onverklaarde #-link. |
| 4473 | `href="#"` | Bewuste actieknop: `event.preventDefault();openEventGallery('stands')`. Standaardnavigatie wordt voorkomen; geen onverklaarde #-link. |
| 4493 | `href="/contact.html"` | Lokaal doel ontbreekt in de checkout. Controleer runtimegedrag/fallback; een klikfunctie kan gewone navigatie onderscheppen. |
| 8900 | `img src=""` | Lege bron; bij deze detail-/lightboxafbeelding vult JavaScript de src later in (regels 6049, 6071, 6295, 7322, 7627). Bewuste placeholder, geen bewezen kapotte externe URL. |
| 9066 | `img src=""` | Lege bron; bij deze detail-/lightboxafbeelding vult JavaScript de src later in (regels 6049, 6071, 6295, 7322, 7627). Bewuste placeholder, geen bewezen kapotte externe URL. |
| 9101 | `img src=""` | Lege bron; bij deze detail-/lightboxafbeelding vult JavaScript de src later in (regels 6049, 6071, 6295, 7322, 7627). Bewuste placeholder, geen bewezen kapotte externe URL. |

Geen lege href-attributen gevonden. Alle vijf lege src-attributen behoren tot dynamisch gevulde afbeeldingen. Alle vijf href="#"-links hebben een expliciete klikfunctie.

### Afbeeldingen zonder src

| Regel | Bevinding |
| --- | --- |
| 3961 | `Hamburg STANDS` heeft geen src. Site Photos/Supabase moet de afbeelding later invullen; zonder beschikbare data blijft de afbeelding zonder bron. |
| 3972 | `Leipzig Vintage Fußballbörse` heeft geen src. Site Photos/Supabase moet de afbeelding later invullen; zonder beschikbare data blijft de afbeelding zonder bron. |
| 4420 | `Hamburg STANDS Vintage Fußballbörse` heeft geen src. Site Photos/Supabase moet de afbeelding later invullen; zonder beschikbare data blijft de afbeelding zonder bron. |
| 4427 | `Leipzig Vintage Fußballbörse` heeft geen src. Site Photos/Supabase moet de afbeelding later invullen; zonder beschikbare data blijft de afbeelding zonder bron. |

### Cloudinary: controle van letterlijke href/src-adressen

| Regels | URL | Resultaat |
| --- | --- | --- |
| 3553 | https://res.cloudinary.com/dinpfdojh/image/upload/v1782671925/WhatsApp_Image_2026-06-28_at_20.36.59_j4ezzn.jpg | HTTP 401: cloud_name dinpfdojh is disabled |
| 3557 | https://res.cloudinary.com/dinpfdojh/image/upload/v1782464483/WhatsApp_Image_2026-06-26_at_11.00.05_ifprot.jpg | HTTP 401: HTTP Error 401: Unauthorized |
| 3561 | https://res.cloudinary.com/dinpfdojh/image/upload/v1783254946/WhatsApp_Image_2026-07-05_at_14.23.31_sep2b6.jpg | HTTP 401: HTTP Error 401: Unauthorized |
| 3914 | https://res.cloudinary.com/dinpfdojh/image/upload/v1782647123/WhatsApp_Image_2026-06-28_at_13.39.48_kc6nqw.jpg | HTTP 401: cloud_name dinpfdojh is disabled |
| 3926 | https://res.cloudinary.com/dinpfdojh/image/upload/v1782464482/WhatsApp_Image_2026-06-26_at_11.00.04_1_piofvi.jpg | HTTP 401: cloud_name dinpfdojh is disabled |
| 3938 | https://res.cloudinary.com/dinpfdojh/image/upload/v1782464482/WhatsApp_Image_2026-06-26_at_10.59.21_wrmt7z.jpg | HTTP 401: cloud_name dinpfdojh is disabled |
| 3950 | https://res.cloudinary.com/dinpfdojh/image/upload/v1783254945/WhatsApp_Image_2026-07-05_at_14.23.31_3_wciswg.jpg | HTTP 401: HTTP Error 401: Unauthorized |
| 4392 | https://res.cloudinary.com/dinpfdojh/image/upload/c_limit,w_600,q_auto,f_auto/v1782647123/WhatsApp_Image_2026-06-28_at_13.39.48_kc6nqw.jpg | HTTP 401: cloud_name dinpfdojh is disabled |
| 4399 | https://res.cloudinary.com/dinpfdojh/image/upload/c_limit,w_600,q_auto,f_auto/v1782464482/WhatsApp_Image_2026-06-26_at_11.00.04_1_piofvi.jpg | HTTP 401: HTTP Error 401: Unauthorized |
| 4406 | https://res.cloudinary.com/dinpfdojh/image/upload/c_limit,w_600,q_auto,f_auto/v1782464482/WhatsApp_Image_2026-06-26_at_10.59.21_wrmt7z.jpg | HTTP 401: cloud_name dinpfdojh is disabled |
| 4413 | https://res.cloudinary.com/dinpfdojh/image/upload/c_limit,w_600,q_auto,f_auto/v1783254945/WhatsApp_Image_2026-07-05_at_14.23.31_3_wciswg.jpg | HTTP 401: HTTP Error 401: Unauthorized |
| 9040 | https://res.cloudinary.com/dinpfdojh/video/upload/v1784635503/openart-video_1784557449812_135b9230_1784557449840_13ecf9c3_bxe8ra.mp4 | HTTP 401: cloud_name dinpfdojh is disabled |

12 unieke Cloudinary-assetadressen gecontroleerd. Alle retourneren HTTP 401; meerdere antwoorden bevatten `x-cld-error: cloud_name dinpfdojh is disabled`. Deze bronnen werken op het controlemoment niet. Een aanvullend GET-verzoek voor de afbeelding op regel 3553 bevestigt dezelfde status en foutmelding. Het Cloudinary-account lijkt uitgeschakeld; dit is geen vastgestelde typefout in een individueel pad. Regel 117 is alleen een preconnect naar de host: de 404 op de host-root is geen kapotte afbeeldingslink.

Dynamische bronnen zoals getThumb, cldSize, item.image, s.image en EVENT_GALLERIES zijn afhankelijk van runtimegegevens. Een volledige controle van die uiteindelijke Cloudinary-adressen vereist geladen gegevens.

## 2. Afbeeldingen zonder of met lege alt-tekst

| Regel | Situatie | Bevinding |
| --- | --- | --- |
| 3043 | `alt=""` | Afbeelding wordt als decoratief behandeld. Hier betreft het product-/galerij-/shirtbeelden; beoordelen of een beschrijving nodig is. De onderzochte code vult geen beschrijvende alt in. |
| 3553 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 3557 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 3561 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 3683 | `alt=""` | Afbeelding wordt als decoratief behandeld. Hier betreft het product-/galerij-/shirtbeelden; beoordelen of een beschrijving nodig is. De onderzochte code vult geen beschrijvende alt in. |
| 4981 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 5034 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 5035 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 5038 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 5290 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 6057 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 6079 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 6259 | `alt=""` | Afbeelding wordt als decoratief behandeld. Hier betreft het product-/galerij-/shirtbeelden; beoordelen of een beschrijving nodig is. De onderzochte code vult geen beschrijvende alt in. |
| 7222 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 7267 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 7268 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 7324 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 7475 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 7594 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 8704 | Alt kan dynamisch leeg worden | De uitdrukking gebruikt een lege fallback wanneer de titel ontbreekt; afhankelijk van de runtimegegevens. |
| 8739 | `alt=""` | Afbeelding wordt als decoratief behandeld. Hier betreft het product-/galerij-/shirtbeelden; beoordelen of een beschrijving nodig is. De onderzochte code vult geen beschrijvende alt in. |
| 8780 | Alt ontbreekt | Afbeelding heeft geen tekstalternatief; geldt ook voor deze declaratie wanneer zij via JavaScript wordt gerenderd. |
| 8900 | `alt=""` | Afbeelding wordt als decoratief behandeld. Hier betreft het product-/galerij-/shirtbeelden; beoordelen of een beschrijving nodig is. De onderzochte code vult geen beschrijvende alt in. |
| 9066 | `alt=""` | Afbeelding wordt als decoratief behandeld. Hier betreft het product-/galerij-/shirtbeelden; beoordelen of een beschrijving nodig is. De onderzochte code vult geen beschrijvende alt in. |
| 9101 | `alt=""` | Afbeelding wordt als decoratief behandeld. Hier betreft het product-/galerij-/shirtbeelden; beoordelen of een beschrijving nodig is. De onderzochte code vult geen beschrijvende alt in. |

Totaal: 9 declaraties zonder alt en 7 declaraties met letterlijk lege alt. Herhaalde declaraties/templates zijn afzonderlijk geteld, niet het aantal uiteindelijk gerenderde afbeeldingen. Een lege alt kan voor decoratieve afbeeldingen terecht zijn; dit rapport beschrijft de context en wijzigt niets.

Andere sjablonen met bijvoorbeeld `${s.title}`, `${item.title}` of `esc(it.title)` hebben een alt-attribuut, maar de kwaliteit en aanwezigheid van de titel zijn zonder runtimegegevens niet vastgesteld.

## Conclusie

Concrete bevindingen: ontbrekende en lege alt-teksten, dynamische afbeeldingsplaceholders en ontbrekende lokale linkdoelen zoals hierboven vermeld. Geen #-link zonder expliciete reden gevonden. De twaalf letterlijke Cloudinary-assetadressen werken tijdens deze controle niet: HTTP 401, cloud_name dinpfdojh is disabled.
