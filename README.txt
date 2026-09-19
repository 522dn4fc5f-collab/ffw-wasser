FEUERWEHR WASSER
=================

Version 2.0

ZWECK
-----
Die Web-App erfasst Probenarten, Anwesenheiten, Taktik, Abschlüsse, Berichte, Historie und Jahresstatistik.

INSTALLATION UND AKTUALISIERUNG
-------------------------------
1. Das ZIP-Paket vollständig entpacken.
2. Alle bestehenden Projektdateien durch die neuen Dateien ersetzen.
3. Die geöffnete Web-App und alle zugehörigen Browserfenster schließen.
4. Die Web-App neu öffnen und vollständig neu laden.
5. Wenn noch alte Texte oder die alte Oberfläche erscheinen, den Website- beziehungsweise PWA-Cache löschen und die Anwendung neu öffnen.

ABLAUF EINER PROBE
------------------

SCHRITT 1: PROBENART AUSWÄHLEN
- Allgemeine Probe, Sonderprobe oder Unterricht markieren.
- Die gewünschte Probenart markieren.
- Die Schaltfläche "Weiter zu Schritt 2" wird aktiviert.
- Mit der Schaltfläche Schritt 2 öffnen.
- Anwesend ist beim Öffnen bereits aktiv.
- Über die Schrittanzeige 1 kann jederzeit zur Probenart-Auswahl zurückgekehrt werden.

SCHRITT 2: ANWESENHEIT ERFASSEN
- Allgemeine Probe: Anwesend oder Entschuldigt.
- Sonderprobe: Anwesend, Entschuldigt oder Betrifft nicht.
- Unterricht: Anwesend oder Entschuldigt.
- Anwesend ist beim Öffnen voreingestellt.
- Statusreiter wählen, Personen markieren und Auswahl speichern.
- Die Altersmannschaft wird in einem eigenen Bereich angezeigt.
- Mit "Weiter zu Schritt 3" wird Schritt 3 geöffnet.

SCHRITT 3: TAKTIK ODER ABSCHLUSS
Die Taktik ist kein eigener Menüpunkt mehr, sondern Bestandteil von Schritt 3.
- Allgemeine Probe: Taktik prüfen und anschließend abschließen.
- Sonderprobe und Unterricht: direkt zum Probeabschluss.

PROBENART WECHSELN
------------------
Beim Wechsel werden die aktuelle Markierung, der Status, die eingeblendete Taktik, temporäre Taktikzuordnungen und ein begonnener Abschluss zurückgesetzt. Bereits erfasste heutige Einträge werden nur nach Bestätigung gelöscht.

KOPFBEREICH
-----------
Der Kopfbereich enthält Logo, Feuerwehr Wasser, Home und Menü. Während einer laufenden Probe erscheint zusätzlich eine kompakte Statuszeile mit Probenart sowie den Zahlen für anwesende und entschuldigte Personen.

ABSCHLUSS UND AUSGABEN
----------------------
Beim Abschluss wird das Thema der Probe erfasst. Anschließend werden die vorgesehenen Ausgaben erzeugt oder aktualisiert:
- CSV-Auswertung
- PDF-Probenbericht
- Eintrag in der Historie

HISTORIE
-------------------
Bei einer Korrektur werden die zugehörige CSV und der PDF-Bericht gemeinsam aktualisiert. Bei ausgewählten Speicherordnern werden die vorhandenen Dateien mit demselben Namen überschrieben.
Abgeschlossene Proben werden nach Kalenderjahr und Monat geordnet. Vorhandene Einträge können angezeigt und, soweit vorgesehen, korrigiert oder erneut ausgegeben werden.

STATISTIK
---------
Die Statistik wertet das aktuelle Kalenderjahr aus. Einsatzabteilung und Altersmannschaft werden getrennt dargestellt. Zusätzlich steht eine persönliche Mitgliedsauswertung zur Verfügung.

EINSTELLUNGEN
-------------
- Mitgliederverwaltung
- persönliche Funktionen und Fahrzeugberechtigungen
- jährliche Funktionsziele
- Admin-PIN
- Speicherorte für CSV, PDF und Backups

DATENSICHERUNG
--------------
Vor größeren Änderungen sollte ein vollständiges Backup erstellt werden. Vorhandene Backups können wieder importiert werden.

FEHLERBEHEBUNG
--------------

WEITER ZU SCHRITT 2 FUNKTIONIERT NICHT
1. Prüfen, ob wirklich Version 2.0 geladen wurde.
2. Die Anwendung vollständig schließen.
3. Den Website- beziehungsweise PWA-Cache entfernen.
4. Das aktuelle Paket vollständig einspielen.
5. Die Anwendung neu öffnen und eine Probenart antippen.

ALTE TEXTE ODER ALTE OBERFLÄCHE
Eine alte Darstellung deutet auf einen alten Offline-Cache oder unvollständig ersetzte Projektdateien hin. Das aktuelle Paket vollständig einspielen und den Cache entfernen.

CSV ODER PDF WIRD NICHT GESPEICHERT
Den betreffenden Speicherort erneut auswählen und die Browserberechtigung für den Ordner prüfen.

TECHNISCHE PRÜFUNGEN
--------------------
- JavaScript-Syntax aller Dateien geprüft
- Service-Worker-Syntax geprüft
- Probenart-Auswahl geprüft
- Rückkehr zu Schritt 1 und Weiter-Button zu Schritt 2 geprüft
- Sichtbarkeit von Schritt 2 geprüft
- bedingte Taktik in Schritt 3 geprüft
- Hilfe und README.txt auf aktuellen Stand gebracht
- ZIP-Integrität geprüft

VERSION 2.0 - DESIGNABSCHLUSS
-----------------------------
- Geführter Ablauf mit drei eindeutig markierten Schritten
- Home führt zuverlässig zu Schritt 1 zurück
- Statusauswahl im Stil farbiger Akten: grün, orange oder grau
- Aktiver Reiter und Teilnehmerkarte bilden eine zusammenhängende Fläche
- Kein horizontaler Scrollbalken an den Statusreitern
- Keine störende Trennlinie oberhalb der Schrittanzeige
- Einheitliche Abstände, Rundungen, Typografie und Zustandsfarben
- Vollständige technische Plausibilitätsprüfung dokumentiert in PLAUSIBILITAETSPRUEFUNG.txt

HINWEIS ZUM PAKET
-----------------
Dieses ZIP ist das Aktualisierungspaket für eine bestehende Installation. Es enthält alle geänderten CSS-, JavaScript- und Service-Worker-Dateien. Die Dateien müssen vollständig über die gleichnamigen Dateien der bestehenden Installation kopiert werden.

WIEDERHERSTELLUNG DER OBERFLAECHE
---------------------------------
Die experimentelle Laufzeit-Umschreibung der Versionsanzeige wurde vollständig entfernt. Die Oberfläche und vorhandene HTML-Struktur werden nicht mehr nachträglich verändert.

SICHERE VERSIONSAENDERUNG AUF 2.0
---------------------------------
Es werden ausschließlich Textknoten geändert, deren vollständiger Inhalt exakt 'Version 1.3', 'Version 1.3.0', '1.3' oder '1.3.0' ist. HTML-Container, Klassen, IDs und Bedienelemente bleiben unverändert.
