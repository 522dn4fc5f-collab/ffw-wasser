# Feuerwehr Wasser – wartungsbereinigter Stand

Dieser Stand enthält keine beabsichtigten fachlichen oder sichtbaren Funktionsänderungen.

## Behobene technische Punkte

- Historische und korrigierte PDF-Berichte verwenden das ursprüngliche Probendatum.
- RFID-Kennungen werden im vollständigen Backup mitgesichert.
- Die bestehende Einstellung `functionEntryEnabled` wird vollständig gesichert.
- Die PDF-Ordnerberechtigung verwendet die vorhandene zentrale Berechtigungsprüfung.
- Der Service Worker besitzt einen eindeutigen Cache-Stand.
- Das von der vorhandenen Anwendung erwartete Web-App-Manifest ist im Paket enthalten.

## Bewusst unverändert

- Probenarten und Status
- Anwesenheitsablauf
- Taktikregeln und Fahrzeugreihenfolge
- Jahresziele und Statistikberechnung
- CSV-Spalten und Dateinamen
- Navigation, Gestaltung und Touch-Optimierung
- PIN-Verhalten

## Installation

Die Verzeichnisstruktur muss erhalten bleiben. Die Anwendung über einen Webserver bzw. das bisherige Hosting bereitstellen. Danach die Web-App vollständig neu laden, damit der neue Service-Worker-Cache aktiv wird.
