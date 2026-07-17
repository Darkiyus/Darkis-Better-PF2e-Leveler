# Modul im offiziellen Foundry-Paketverzeichnis eintragen

## Status: Entschieden – Option C umgesetzt (2026-07-17)

Das Modul läuft jetzt unter einer eigenen Paket-ID (`darkis-better-pf2e-leveler`)
statt der ursprünglich vom Original (RoiLeaf) belegten ID `pf2e-leveler`. Damit ist
dies jetzt ein eigenständiges Foundry-Modul, kein Drop-in-Replacement mehr. Grund:
Die ID `pf2e-leveler` ist auf foundryvtt.com bereits unter RoiLeafs Konto vergeben
(https://foundryvtt.com/packages/pf2e-leveler) und Foundry-Paket-IDs sind global
eindeutig – ein eigenständiges Verzeichnis-Listing war unter der alten ID nicht
möglich (siehe Historie unten).

Bereits umgesetzt in `module.json`, `scripts/constants.js` (`MODULE_ID`) und
`.github/workflows/main.yml`. Credits an RoiLeaf für das ursprüngliche Modul und
seine Architektur bleiben in der README erhalten.

## Noch offen: Eintrag im offiziellen Verzeichnis

Die Umbenennung selbst macht das Modul noch nicht in Foundrys eingebauter
Modul-Suche sichtbar – dafür braucht es weiterhin ein manuelles "Submit Package"
auf foundryvtt.com. Das ist unabhängig vom Code und muss von Hand gemacht werden:

1. Auf foundryvtt.com einloggen (Darkiyus-Konto).
2. Community → Packages → „Submit Package".
3. Felder, ausgefüllt nach aktuellem `module.json`:

   | Feld | Wert |
   |---|---|
   | Package Type | Module |
   | Package ID | `darkis-better-pf2e-leveler` |
   | Title | `Darkis Better PF2e-Leveler` |
   | Author | Darkiyus |
   | Repository URL | `https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler` |
   | Manifest URL | `https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler/releases/latest/download/module.json` |
   | Beschreibung | Text aus `module.json` → `"description"`, oder die Kurzbeschreibung aus der README |
   | Minimum-Kompatibilität | 13 |
   | Verifiziert | 14 |
   | System | Pathfinder Second Edition (`pf2e`), Starfinder Second Edition (`sf2e`) |

4. Nach Freischaltung: `FVTT_API_TOKEN` als Secret unter Repo → Settings →
   Secrets and variables → Actions hinterlegen. Der `publish-to-foundry`-Job in
   `.github/workflows/main.yml` ist dafür bereits vorbereitet (nutzt jetzt die neue
   Paket-ID) und published dann automatisch bei jedem neuen GitHub-Release.

Bis dahin bleibt die Installation über die Manifest-URL (siehe README) der Weg zur
Installation.

## Wichtig für bestehende Testinstallationen

Wer das Modul bereits unter der alten ID (`pf2e-leveler`, bis Version 3.8.5)
installiert hatte, bekommt nach dem Update einen **neuen, separaten** Modul-Eintrag
in Foundry. Einstellungen und modul-eigene Daten aus der alten Installation werden
nicht automatisch übernommen. Die alte Installation kann danach deaktiviert oder
entfernt werden. Das ist in der README dokumentiert.

---

## Historie: ursprüngliche Optionsabwägung (vor der Entscheidung)

Foundry-Paket-IDs sind global eindeutig und an das Konto gebunden, das sie zuerst
registriert. Drei Optionen standen zur Wahl:

- **A – ID beibehalten, kein Verzeichnis-Listing.** War der Stand bis 3.8.5:
  Drop-in-Replacement mit derselben ID wie das Original, Installation nur über
  Manifest-URL, kein Erscheinen in Foundrys eingebauter Modul-Suche.
- **B – Als Mitverwalter beim bestehenden Paket eintragen lassen.** Nur möglich mit
  Zustimmung von RoiLeaf.
- **C – Eigene, neue Paket-ID registrieren (gewählt).** Eigenständiges Listing
  möglich, bricht aber die Drop-in-Kompatibilität zu bestehenden Installationen
  unter der alten ID – genau das ist jetzt so entschieden und umgesetzt worden.
