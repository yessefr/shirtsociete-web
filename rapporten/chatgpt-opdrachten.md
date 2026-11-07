# Opdrachten voor ChatGPT / Codex (kopieer per opdracht)

Algemeen voorwoord (plak bij elke opdracht): "Je werkt voor Shirt Société (shirtsociete.com), een webshop voor vintage en match worn voetbalshirts in Harderwijk, Nederland. Teksten op de site zijn Engels. Regels: schrijf alleen feiten die in de aangeleverde gegevens staan; claim nooit echtheid of herkomst die niet bewezen is; gebruik 'match worn' alleen voor shirts die zo staan aangegeven; geen aantallen, reviews of certificaten verzinnen. Toon: zorgvuldig, verzamelaar-tot-verzamelaar, geen overdreven reclametaal. Werk in een eigen branch (codex/<onderwerp>) en lever een pull request in repo yessefr/shirtsociete-web. Pas index.html en admin.html NIET aan."

## A. Clubteksten (issue #88)
"Open content/club-intros.json. Voor elke clubnaam (sleutel) schrijf je een introtekst van 2 tot 3 zinnen in het Engels voor de clubpagina. Gebruik alleen algemene, controleerbare clubfeiten (stad, bekende periode of speler die in de shirttitels voorkomt in products.xml). Geen claims over echtheid. Vul de lege strings in; wijzig de sleutels niet; laat de _README staan. Lever een pull request."

## B. Duitse pagina's (issue #89)
"Maak concept-pagina's in de map de/ (kijk eerst naar de bestaande bestanden) voor: Bayern München shirts, Match-Worn-Trikots en 'Trikot verkaufen'. Duits, natuurlijk en feitelijk. Zet bovenaan de PR een lijst met zinnen die een Duitse moedertaalspreker moet nalopen. Geen publicatie zonder die controle."

## C. Pinterest-teksten (issue #91)
"Lees social/pinterest-boards.md. Verfijn de 8 boardbeschrijvingen (zoekwoordrijk, feitelijk, max 500 tekens, laatste in het Duits). Lever 12 extra pin-titels en -beschrijvingen voor educatieve pins (labels, wastekst, stiknaden, badges) zonder echtheidsclaims, als nieuw bestand social/pinterest-educatief.md."

## D. Review (issue #92)
"Review PR #84 (scripts/catalog-qa.js, scripts/pinterest-pins.js, rapporten/groeiplan-verwerking.md): klopt elke claim in de teksten met de databasevelden? Zijn er regels die iets bevestigen wat niet gecontroleerd is? Geef review-commentaar, wijzig zelf niets."

## E. Journal-guides (issue #88)
"Schrijf conceptartikelen (Engels, 700 tot 900 woorden) voor: 'How to read a football shirt label', 'Vintage shirt sizing explained' (check de bestaande Journal-pagina's om dubbel werk te voorkomen) en 'Match worn vs match issued vs player issue'. Gebruik de structuur van de bestaande journal/-bestanden. Lever als conceptbestanden (bijv. concepten/*.md) in een PR; Claude verwerkt ze in de generator."
