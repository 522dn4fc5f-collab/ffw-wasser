Desktop-Personenkarten kompakt, iPad/Touch unveraendert gross

1. Datei css/desktop-cards.css in den css-Ordner bei GitHub hochladen.
2. In index.html direkt NACH der Zeile fuer css/features.css einfuegen:

<link href="css/desktop-cards.css?v=20260919-37" rel="stylesheet"/>

3. Committen und Desktop-Seite neu laden.

Die Regeln greifen nur bei Geraeten mit Mauszeiger:
@media (hover:hover) and (pointer:fine)
Auf iPad und anderen Touch-Geraeten bleiben die grossen Karten erhalten.
