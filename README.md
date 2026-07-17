<div align="center">

# Darkis Better PF2e-Leveler

**Schnellere Charaktererschaffung, bessere Kampagnenkontrolle und optionale deutsche Oberfläche für Foundry VTT.**  
**Faster character creation, better campaign control, and an optional German interface for Foundry VTT.**

<p>
  <a href="https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler/releases/latest">
    <img alt="Latest Release" src="https://img.shields.io/github/v/release/Darkiyus/Darkis-Better-PF2e-Leveler?style=for-the-badge&logo=github">
  </a>
  <a href="https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler/blob/master/LICENSE">
    <img alt="MIT License" src="https://img.shields.io/github/license/Darkiyus/Darkis-Better-PF2e-Leveler?style=for-the-badge">
  </a>
  <img alt="Foundry VTT 13+" src="https://img.shields.io/badge/Foundry_VTT-13%2B-7a0b0b?style=for-the-badge">
  <img alt="PF2e 7+" src="https://img.shields.io/badge/PF2e-7.0.0%2B-1d3557?style=for-the-badge">
</p>

<p>
  <img alt="Languages" src="https://img.shields.io/badge/Languages-DE_%7C_EN_%7C_FR_%7C_CN-4b2e83?style=flat-square">
  <img alt="SF2e support" src="https://img.shields.io/badge/SF2e-0.0.10%2B-334155?style=flat-square">
  <img alt="Community Fork" src="https://img.shields.io/badge/Type-Community_Fork-5b1734?style=flat-square">
</p>

[Deutsch](#deutsch) · [English](#english) · [Installation](#installation) · [Changelog](CHANGELOG.md) · [Originalprojekt](https://github.com/roi007leaf/pf2e-leveler)

</div>

---

> [!IMPORTANT]
> **Darkis Better PF2e-Leveler ist ein eigenständig veröffentlichtes Community-Fork von [RoiLeaf – PF2e Leveler](https://github.com/roi007leaf/pf2e-leveler).**  
> Es besitzt die eigene Modul-ID `darkis-better-pf2e-leveler` und ersetzt das Original nicht. Beide Module können installiert sein, pro Welt sollte jedoch nur eines aktiviert werden.

> [!WARNING]
> Versionen dieses Forks bis einschließlich **3.8.5** verwendeten noch die Modul-ID `pf2e-leveler`. Beim Wechsel auf die neue Modul-ID werden frühere Moduleinstellungen und modulinterne Daten nicht automatisch übernommen. Mehr dazu unter [Migration](#migration-von-version-385-oder-älter).

<table>
<tr>
<td width="50%" valign="top">

### ⚡ Performance / Leistung

Schlankere Kompendiumsindizes, geteilte Sitzungscaches, verzögerte Suchanfragen und begrenzte Ergebnislisten sorgen auch bei großen Inhaltsbibliotheken für eine deutlich flüssigere Bedienung.

</td>
<td width="50%" valign="top">

### 🇩🇪 German localization / Deutsche Oberfläche

Eine optionale vollständige deutsche Moduloberfläche mit etablierten PF2e-Begriffen – zusätzlich zu Englisch, Französisch und vereinfachtem Chinesisch.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🧭 GM Setup / SL-Einrichtung

Ein Einrichtungsassistent bündelt Sprache, Seltenheiten, Inhaltsquellen, Variantenregeln, Prüfanfragen und Spielerzugriffe an einem Ort.

</td>
<td width="50%" valign="top">

### 🎒 Quick equipment / Schnellausrüstung

Eigene Starter- und Klassenausrüstungspakete aus normalen PF2e-Gegenständen – inklusive Bild, Beschreibung, Preis, Last und Mengen.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🗂️ Campaign profiles / Kampagnenprofile

Relevante Leveler- und PF2e-Einstellungen lassen sich als JSON zwischen Welten übertragen und mit einer integrierten Diagnose prüfen.

</td>
<td width="50%" valign="top">

### 🖼️ Gallery & previews / Galerie & Vorschau

Galerieansichten und vergrößerte Bildvorschauen erleichtern das Durchsuchen von Abstammungen, Herkünften, Talenten, Zaubern und Ausrüstung.

</td>
</tr>
</table>

---

# Deutsch

## Was ist Darkis Better PF2e-Leveler?

Darkis Better PF2e-Leveler unterstützt die **Charaktererschaffung** und die **Planung von Stufenaufstiegen** in Foundry VTT für Pathfinder Second Edition und Starfinder Second Edition.

Der Fork erweitert die Grundlage des ursprünglichen PF2e Leveler vor allem in vier Bereichen:

- spürbar flüssigere Bedienung bei großen Kompendien,
- optionale deutsche Moduloberfläche,
- zusätzliche Werkzeuge für Spielleiter und eigene Kampagnen,
- Verbesserungen an Stabilität, Übersicht und Bedienbarkeit.

Das Modul ist ein persönliches, nicht kommerzielles Hobbyprojekt. Es entstand für meine eigenen PF2e-Runden und wird öffentlich geteilt, weil die Änderungen auch anderen Gruppen helfen können.

## Warum dieser Fork?

Zuerst ein großes Dankeschön an **RoiLeaf**, den ursprünglichen Entwickler von PF2e Leveler. ❤️ Die Grundidee, die ursprüngliche Architektur und ein großer Teil der Basisfunktionen stammen aus seinem Projekt. Ohne diese Arbeit würde dieser Fork nicht existieren.

Beim Einsatz in meinen eigenen Runden fielen mir einige Stellen auf, die ich gezielt verbessern wollte:

- Große Kompendien konnten die Suche und Oberfläche stark ausbremsen.
- Eine vollständige deutsche Moduloberfläche fehlte.
- Spielleiter benötigten mehr Kontrolle über Herkünfte, Quellen und Kampagnenregeln.
- Neue Spieler sollten schneller mit verständlichen Ausrüstungspaketen starten können.
- Wiederkehrende Kampagneneinstellungen sollten sich leichter zwischen Welten übertragen und prüfen lassen.

## Die wichtigsten Erweiterungen

### Schnellere und stabilere Oberfläche

- Suchvorgänge starten erst ab drei Zeichen und werden um 250 ms verzögert.
- Veraltete asynchrone Suchergebnisse werden verworfen.
- Ausrüstung, Talente und Zauber rendern höchstens 200 Ergebniszeilen gleichzeitig.
- Listen verwenden nach Möglichkeit schlanke Kompendiumsindizes statt vollständiger Dokumente.
- Bereits geladene Kompendien und laufende Anfragen werden innerhalb der Foundry-Sitzung geteilt.
- Aufwendige Berechnungen werden wiederverwendet, solange sich der Charakter nicht tatsächlich verändert.
- Mehrere Zauberkompendien können parallel geladen werden.
- Geschlossene Auswahlfenster werden nach verspäteten Ladevorgängen nicht erneut gerendert.

### Mehr Kontrolle über Kampagneninhalte

- Standard-, vielseitige und gemischte Herkünfte können empfohlen, eingeschränkt oder verboten werden.
- Herkünfte aus Übersetzungs- oder Homebrew-Kompendien werden über stabile Schlüssel zusammengeführt.
- Spielleiter können verbotene Optionen weiterhin bewusst überschreiben.
- Aktive Zugriffs- und Variantenregeln werden Spielern vor dem Anwenden des Charakters angezeigt.
- Inhaltsquellen, Seltenheiten und Spielerzugriffe lassen sich zentral verwalten.

### Einrichtungsassistent für Spielleiter

Der optionale Assistent bündelt:

- Foundry-Sprache,
- erlaubte Seltenheiten,
- Kompendiums- und Inhaltsquellen,
- Leveler-Regeln,
- erkannte PF2e-Varianten,
- Prüfanfragen,
- Spielerzugriffe.

Die Presets **Ausgewogen**, **Eingeschränkt** und **Homebrew-freundlich** dienen als Ausgangspunkt. Der Assistent kann jederzeit erneut über die Moduleinstellungen geöffnet werden.

### Eigene Schnellausrüstungspakete

Spielleiter können wiederverwendbare Starter- und Klassenausrüstung erstellen. Ein Paket kann enthalten:

- Name, Bild und Beschreibung,
- Klasse und empfohlene Stufe,
- Seltenheit und Merkmale,
- beliebige normale PF2e-Gegenstände mit Mengenangabe,
- automatisch berechneten Gesamtpreis und Gesamtlast.

Dadurch lassen sich vollständige Startausrüstungen bereitstellen, ohne Gegenstände mehrfach manuell zusammensuchen zu müssen.

### Kampagnenprofile und Diagnose

Relevante Einstellungen können als JSON-Profil zwischen Foundry-Welten übertragen werden. Dazu gehören unter anderem:

- Leveler-Welteinstellungen,
- Inhaltsvorgaben,
- Kompendiumszuordnungen,
- Schnellausrüstungspakete,
- unterstützte PF2e-Varianten.

Die Diagnose erkennt unter anderem:

- fehlende Kompendien,
- veraltete Inhaltsverweise,
- fehlende Paketgegenstände,
- doppelte Herkunftsschlüssel,
- widersprüchliche Prüfeinstellungen,
- den Zustand der Laufzeit-Caches.

Die Diagnose verändert keine Daten. Nur **Laufzeit-Caches leeren** verwirft geladene Listen, damit sie bei der nächsten Verwendung neu aufgebaut werden.

### Galerieansicht und Bildvorschau

- Abstammungen und Herkünfte können als kompakte Liste oder als große Galerie dargestellt werden.
- Die gewählte Ansicht wird pro Benutzer gespeichert.
- Beim Überfahren von Bildern erscheint eine vergrößerte Vorschau neben dem Mauszeiger.
- Die Vorschau funktioniert unter anderem bei Abstammungen, Herkünften, Talenten, Zaubern, Ausrüstung und SL-Inhaltsvorgaben.

### Verbesserte Charaktererschaffung

- Verständlichere Erklärung von Attributsverbesserungen, Attributsschwächen und alternativen Abstammungsverbesserungen.
- Dynamische Anzeige der verbleibenden vier freien Attributsverbesserungen.
- Export und Import von Charaktererschaffungsentwürfen.
- Sichtbare Zusammenfassung der aktiven Kampagnen- und Zugriffsregeln.
- Robusteres Verhalten der Leveler-Schaltflächen bei Sheet-Themes und UI-Modulen.
- Frei belegbares Foundry-Tastenkürzel **Umschalt+L** für einen ausgewählten oder zugewiesenen Charakter.

### Korrekturen und Kompatibilität

- Deutsche Fertigkeitsvoraussetzungen wie **„Geübt in Athletik“** und **„Experte in Heilkunde“** werden korrekt erkannt.
- Abstammungs- und Homebrew-Herkunftsvoraussetzungen können gemeinsam geprüft werden.
- Beim Zeit-Orakel verleiht **Advanced Revelation** korrekt **Time Skip** statt **Manifold Lives**.
- **Greater Revelation** verleiht weiterhin **Manifold Lives**.

> [!NOTE]
> Namen und Beschreibungen von Talenten, Zaubern, Gegenständen und anderen Spielinhalten stammen aus den aktiven PF2e-/SF2e-Kompendien. Für übersetzte Spielinhalte muss zusätzlich eine passende System- oder Kompendiumsübersetzung aktiv sein.

<details>
<summary><strong>Technische Details zur Performance-Überarbeitung</strong></summary>

Der Charakterassistent lädt für Listen bevorzugt schlanke Kompendiumsindizes statt vollständiger Dokumente. Bereits geladene Pakete und laufende Anfragen werden während der gesamten Foundry-Sitzung zwischen Assistenten geteilt.

Hintergrunddaten werden priorisiert und während Leerlaufzeiten nacheinander geladen. Aufwendige, schrittübergreifende Berechnungen werden bis zur nächsten tatsächlichen Charakteränderung wiederverwendet.

Unveränderliche Ausrüstungsfilter werden zwischengespeichert. Veraltete Suchantworten dürfen neuere Ergebnisse nicht mehr überschreiben. Dadurch reduziert sich sowohl die Anzahl vollständiger Dokumentabrufe als auch die Zahl gleichzeitig erzeugter DOM-Elemente.

</details>

## Installation

1. Öffne in Foundry VTT **Zusatzmodule**.
2. Wähle **Modul installieren**.
3. Füge folgende Adresse in das Feld **Manifest-URL** ein:

```text
https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler/releases/latest/download/module.json
```

4. Klicke auf **Installieren**.
5. Aktiviere anschließend **Darkis Better PF2e-Leveler** in deiner Welt.

Die Manifest-URL verweist immer auf die neueste veröffentlichte Version dieses Forks.

> [!CAUTION]
> Aktiviere pro Welt nur **Darkis Better PF2e-Leveler** oder das ursprüngliche **PF2e Leveler**. Werden beide gleichzeitig aktiviert, können doppelte Schaltflächen, Menüs oder konkurrierende Abläufe entstehen.

## Anforderungen und getestete Umgebung

### Anforderungen

- Foundry VTT 13 oder neuer
- Pathfinder Second Edition 7.0.0 oder neuer  
  **oder** Starfinder Second Edition 0.0.10 oder neuer
- `socketlib` wird für die zuverlässige Übermittlung von Prüfanfragen empfohlen

### Konkret getestet

- Foundry VTT **14.365**
- Pathfinder Second Edition **8.3.0**
- Starfinder Second Edition wird laut Moduldefinition bis **1.0.1** als verifiziert geführt

Die Moduldefinition unterstützt weiterhin Foundry VTT ab Version 13 sowie PF2e ab 7.0.0. Die genannten Versionen bezeichnen die konkret geprüfte Kombination und keine harte Obergrenze.

## Migration von Version 3.8.5 oder älter

Frühere Testversionen dieses Forks verwendeten noch die Modul-ID `pf2e-leveler`. Seit der Umstellung besitzt das Projekt die eigene ID `darkis-better-pf2e-leveler`.

Dadurch behandelt Foundry die neue Version als eigenständiges Modul:

1. Installiere die aktuelle Version über die neue Manifest-URL.
2. Aktiviere **Darkis Better PF2e-Leveler** in der gewünschten Welt.
3. Prüfe und übertrage frühere Einstellungen bei Bedarf manuell.
4. Deaktiviere oder entferne danach die alte Installation.

Moduleinstellungen und modulinterne Daten der alten ID werden nicht automatisch übernommen.

## Charaktererschaffung exportieren und importieren

Über **Export** am unteren Rand des Charaktererschaffungs-Assistenten wird der aktuelle Entwurf als `<Charaktername>-creation-plan.json` gespeichert. Die Datei enthält die Auswahl des Assistenten, verändert den Charakterbogen aber nicht.

So lädst du einen Entwurf wieder:

1. Öffne den Zielcharakter und starte **Charakter erschaffen**.
2. Klicke unten im Assistenten auf **Import**.
3. Wähle eine zuvor exportierte JSON-Datei aus.
4. Prüfe alle Schritte, besonders Inhalte aus zusätzlichen Modulen oder eigenen Kompendien.
5. Bestätige die Charaktererschaffung erst auf der Zusammenfassungsseite.

Der Import akzeptiert ausschließlich Charaktererschaffungspläne von PF2e Leveler. Stufenpläne verwenden eine getrennte Importfunktion. Referenzierte Module und Kompendien müssen in der Zielwelt aktiv und für den Benutzer zugänglich sein.

## SL-Einrichtung und Kampagnenprofile

Der Einrichtungsassistent öffnet sich für einen Spielleiter einmalig beim ersten Einsatz und bleibt danach unter:

**Moduleinstellungen → PF2e Leveler → Einrichtungsassistent für SL**

Die direkt im Assistenten gewählten Einstellungen werden erst mit **Speichern und abschließen** übernommen. Verknüpfte Detailverwaltungen für Inhaltsvorgaben, Kompendiumsquellen und Ausrüstungspakete besitzen weiterhin eigene Speichern-Schaltflächen.

Ein importiertes Kampagnenprofil wird zunächst nur in den Assistenten geladen und erst beim Abschluss angewendet.

## Sprache auswählen

Deutsch ist optional und wird über die Foundry-Kernkonfiguration des jeweiligen Benutzers ausgewählt. Verfügbar bleiben:

- Deutsch
- Englisch
- Französisch
- Vereinfachtes Chinesisch

Der SL-Einrichtungsassistent bietet dieselbe Foundry-Sprachauswahl direkt an. Die Auswahl gilt für die gesamte Foundry-Oberfläche des Benutzers und nicht ausschließlich für dieses Modul.

## Roadmap: Homebrew-Götter

Geplant ist eine eigenständige Homebrew-Götter-Erweiterung mit Verbindung zu PF2e Leveler. Das vorgesehene Modell ist ein separates Foundry-Modul, das kompatible PF2e-Gegenstände vom Typ `deity` über ein Kompendium bereitstellt.

Der Leveler soll dieses Kompendium anschließend als Gottheitenquelle verwenden können. Standardgottheiten sollen sich über Kompendiums- und Inhaltsvorgaben aus der Auswahl entfernen lassen.

> [!NOTE]
> Dieses Feature ist geplant und **noch nicht Bestandteil der aktuellen Version**.

## Ursprung, Credits und Lizenz

- **Ursprüngliches Projekt:** [RoiLeaf – PF2e Leveler](https://github.com/roi007leaf/pf2e-leveler)
- **Community-Fork:** [Darkiyus – Darkis Better PF2e-Leveler](https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler)

Dieser Fork ist kein offizielles Release des ursprünglichen Entwicklers.

Das ursprüngliche PF2e Leveler und dieser Fork stehen unter der **MIT-Lizenz**. Der Quellcode darf verwendet, verändert, zusammengeführt, veröffentlicht und weiterverbreitet werden, solange die enthaltenen Copyright- und Lizenzhinweise erhalten bleiben. Details stehen in der Datei [`LICENSE`](LICENSE).

Inhalte, Namen und Marken von Pathfinder, Starfinder, Foundry VTT und anderen Drittprojekten sind davon ausgenommen und unterliegen weiterhin den Rechten ihrer jeweiligen Inhaber.

Der ursprüngliche Entwickler ist ausdrücklich eingeladen, einzelne oder alle Änderungen dieses Forks in sein Projekt zu übernehmen. Offener Austausch und gemeinschaftliche Weiterentwicklung sind ein wesentlicher Teil von Open Source. ❤️

---

# English

## What is Darkis Better PF2e-Leveler?

Darkis Better PF2e-Leveler assists with **character creation** and **level-up planning** in Foundry VTT for Pathfinder Second Edition and Starfinder Second Edition.

It is an independently distributed community fork of RoiLeaf's original PF2e Leveler. The fork focuses on:

- smoother performance with large compendiums,
- an optional German interface,
- expanded Game Master tools,
- better campaign-content control,
- improved stability and usability.

The module uses its own ID, `darkis-better-pf2e-leveler`, and does not replace the original package. Both can be installed, but only one should be enabled in a world.

## Main improvements

### Performance and stability

- Searches begin after three characters and use a 250 ms debounce.
- Stale asynchronous results are discarded.
- Equipment, feat, and spell pickers render no more than 200 rows at once.
- Lightweight compendium indexes are preferred over complete documents.
- Loaded packs and in-flight requests are shared for the Foundry session.
- Expensive cross-step calculations are reused until the character changes.
- Static equipment facets are cached and spell compendiums may load in parallel.
- Closed pickers are not rendered again after delayed loads complete.

### Expanded GM tools

- First-run campaign setup assistant
- Campaign-profile import and export
- Built-in diagnostics and safe runtime-cache clearing
- Content guidance for ancestries, heritages, backgrounds, classes, and other supported options
- Stable heritage matching across translation and homebrew compendiums
- Visible campaign and access rules on the character-creation summary

### Quick-equipment packages

Game Masters can build reusable starter or class loadouts from normal PF2e items. Packages may include a name, image, description, class, level, rarity, traits, quantities, and automatically calculated price and Bulk.

### Gallery and image previews

Ancestry and heritage selectors can switch between compact lists and large-image galleries. Hover previews are available across ancestry, heritage, feat, spell, equipment, and GM guidance lists.

### Localization and usability

- Optional German module localization
- English, French, and Simplified Chinese remain available
- Clearer ability-boost guidance and a live free-boost counter
- Character-creation plan import and export
- More robust sheet controls across themes and UI modules
- Configurable **Shift+L** shortcut for the selected or assigned actor

### Fixes

- German skill-rank prerequisites are recognized correctly.
- Ancestry and homebrew-heritage prerequisites can be evaluated together.
- The Time Oracle's **Advanced Revelation** grants **Time Skip** instead of **Manifold Lives**.
- **Greater Revelation** continues to grant **Manifold Lives**.

> [!NOTE]
> Names and descriptions of feats, spells, equipment, and other game content come from active PF2e/SF2e compendiums. A matching system or compendium translation is required for translated game content.

## Installation

1. Open **Add-on Modules** in Foundry VTT.
2. Select **Install Module**.
3. Paste the following URL into **Manifest URL**:

```text
https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler/releases/latest/download/module.json
```

4. Select **Install**.
5. Enable **Darkis Better PF2e-Leveler** in your world.

> [!CAUTION]
> Enable either Darkis Better PF2e-Leveler or the original PF2e Leveler in a world, not both.

## Requirements and tested environment

### Requirements

- Foundry VTT 13 or newer
- Pathfinder Second Edition 7.0.0 or newer  
  **or** Starfinder Second Edition 0.0.10 or newer
- `socketlib` is recommended for reliable review-request delivery

### Explicitly tested

- Foundry VTT **14.365**
- Pathfinder Second Edition **8.3.0**
- The module manifest currently marks Starfinder Second Edition **1.0.1** as verified

## Migration from version 3.8.5 or earlier

Earlier test releases used the module ID `pf2e-leveler`. Current releases use `darkis-better-pf2e-leveler`, so Foundry treats the module as a separate installation.

1. Install the current release through the new manifest URL.
2. Enable Darkis Better PF2e-Leveler in the target world.
3. Review and recreate old settings where necessary.
4. Disable or remove the legacy installation.

Settings and module-owned data from the old ID are not migrated automatically.

## Character-creation import and export

Use **Export** in the character-creation wizard footer to save the current draft as `<character-name>-creation-plan.json`. The file stores wizard selections without modifying the actor.

To restore a draft:

1. Open the target actor and start **Character Creation**.
2. Select **Import** in the wizard footer.
3. Choose a previously exported JSON file.
4. Review every step, especially content supplied by modules or custom compendiums.
5. Confirm character creation on the Summary step to apply the selections.

Character-creation and level-up plans use separate import workflows. Referenced modules and compendiums must be active and accessible in the target world.

## GM setup and campaign profiles

The setup assistant opens once for a Game Master and remains available under:

**Module Settings → PF2e Leveler → GM Setup Assistant**

Settings selected directly in the assistant are applied through **Save and Finish**. Linked detail managers retain their own Save buttons. Imported campaign profiles remain drafts until the assistant is completed.

## Languages

The module interface supports:

- German
- English
- French
- Simplified Chinese

Language selection uses the Foundry core language setting and therefore applies to the user's complete Foundry interface, not only this module.

## Roadmap: homebrew deities

A separate homebrew-deity companion module is planned. It is intended to provide compatible PF2e `deity` items through a compendium that the Leveler can use as an additional deity source.

This feature is **not included in the current release**.

## Origin, credits, and license

- **Original project:** [RoiLeaf – PF2e Leveler](https://github.com/roi007leaf/pf2e-leveler)
- **Community fork:** [Darkiyus – Darkis Better PF2e-Leveler](https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler)

This fork is not an official release by the original developer.

The original project and this fork are distributed under the **MIT License**. The source may be used, modified, merged, published, and redistributed as long as the included copyright and license notices are retained. See [`LICENSE`](LICENSE) for the complete terms.

Pathfinder, Starfinder, Foundry VTT, and other third-party content and trademarks remain subject to the rights of their respective owners.


The original developer is warmly invited to incorporate any or all changes from this fork into the upstream project. ❤️
