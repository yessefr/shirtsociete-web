# Collector List: mailconcepten (Engels, voor review)

Verstuurd via de bestaande functie `drop-send` (secret staat in Netlify, nooit in de repo). Pas per drop de teksten aan; geen kortingen of aantallen noemen die niet kloppen.

## 1. Drop-aankondiging (1 uur voor Instagram)
**Subject:** New shirts just landed: first access for you
**eyebrow:** Collector List
**heading:** [Aantal] new shirts<br>live now
**lines:**
- Hello collector, as promised: you see them first.
- [Highlight shirt 1: club, season, maat, prijs]
- [Highlight shirt 2: ...]
- Every shirt is one of one. First come, first served.
**highlight:** [Het duurste of zeldzaamste shirt]
**ctaText:** See the new shirts
**ctaUrl:** https://shirtsociete.com/?p=shop&sort=new&utm_source=collector-list&utm_medium=email&utm_campaign=[datum]

JSON-voorbeeld voor `drop-send` (secret zelf invullen):
```json
{"secret":"<SEND_SECRET>","subject":"New shirts just landed: first access for you","eyebrow":"Collector List","heading":"[N] new shirts<br>live now","lines":["Hello collector, as promised: you see them first.","[shirt 1]","[shirt 2]","Every shirt is one of one. First come, first served."],"highlight":"","ctaText":"See the new shirts","ctaUrl":"https://shirtsociete.com/?p=shop&sort=new&utm_source=collector-list&utm_medium=email&utm_campaign=DATUM","testEmail":"jouw@adres.nl"}
```
Eerst altijd met `testEmail` naar jezelf.

## 2. Beurs-nafollow (dag na een beurs, voor bezoekers die zich aanmeldden)
**Subject:** Good to meet you at [beurs]
**lines:** Thanks for stopping by our table. Here is what we still have from the fair: [3 shirts]. Not found what you wanted? Add it to our Want List and we search for it.
**ctaUrl:** https://shirtsociete.com/want-list.html?utm_source=collector-list&utm_medium=email&utm_campaign=[beurs]

## 3. Won't-miss reminder (3 dagen voor een beurs)
**Subject:** See us at [beurs], [datum]
**lines:** We bring [aantal, alleen als het klopt] shirts, including [highlight]. Want one reserved to look at? Reply to this email.

## Let op (aanbeveling)
De mailtemplate in `drop-send.js` heeft geen afmeldlink. Voor een mailinglijst is die verplicht (AVG/e-privacywet). Voorstel: afmeldfunctie `drop-unsubscribe` bouwen; dat vraagt een Netlify-deploy en een SQL-wijziging die jij moet draaien. Zeg het als ik dat moet voorbereiden.
