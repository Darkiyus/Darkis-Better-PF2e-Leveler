# Darkis Better PF2e-Leveler

Darkis Better PF2e-Leveler ist ein Community-Fork von [PF2e Leveler](https://github.com/roi007leaf/pf2e-leveler) mit optionaler deutscher Oberfläche, Fehlerbehebungen und Performance-Verbesserungen. Die ursprüngliche Erweiterung und ihre grundlegende Architektur wurden von **RoiLeaf** entwickelt.

[Deutsch](#deutsch) · [English](#english)

## Deutsch

### Kurzbeschreibung

Darkis Better PF2e-Leveler unterstützt die Charaktererschaffung und die Planung von Stufenaufstiegen in Foundry VTT für Pathfinder Second Edition und Starfinder Second Edition. Es konzentriert sich auf eine flüssigere Bedienung, optionale deutsche Texte und eine bessere Verwaltung eigener Kampagneninhalte. Das Modul läuft unter der eigenen Modul-ID `darkis-better-pf2e-leveler` und ist damit ein eigenständiges Foundry-Modul mit eigenem Namensraum – kein Ersatz für das Original.

Foundry zeigt Darkis Better PF2e-Leveler deshalb als eigenen Eintrag in der Modulliste an, unabhängig vom ursprünglichen PF2e Leveler. Beide können nebeneinander installiert sein; da beide dieselbe Charaktererschaffung und Stufenplanung anbieten, sollte pro Welt aber nur eines der beiden Module aktiv sein, um doppelte Schaltflächen und Menüs zu vermeiden.

**Hinweis für bisherige Tester dieses Forks:** Frühere Versionen (bis einschließlich 3.8.5) liefen noch unter der Modul-ID `pf2e-leveler`. Nach dem Update auf diese Version erscheint das Modul als neuer, separater Eintrag in Foundrys Modulliste; Moduleinstellungen und modul-eigene Daten aus der alten Installation werden nicht automatisch übernommen. Die alte Installation kann danach deaktiviert oder entfernt werden.

### Warum dieser Fork?

Zuerst einmal: Ein riesiges Dankeschön an **RoiLeaf**, den ursprünglichen Entwickler dieses Moduls. ❤️ Die Grundidee und das Modul selbst haben mir so gut gefallen, dass ich PF2e Leveler direkt für meine eigenen Pathfinder-2E-Kampagnen verwenden wollte. Dieser Fork baut auf seiner Arbeit auf und wäre ohne sie nicht entstanden.

Beim Einsatz in meinen eigenen Runden sind mir einige Stellen aufgefallen, die ich gern verbessern oder ergänzen wollte:

- **Performance und Stabilität:** Besonders die Suche nach Gegenständen konnte sehr große Kompendien schon nach einem einzelnen Buchstaben vollständig verarbeiten. Dadurch geriet Foundry teilweise stark ins Stocken oder die Oberfläche reagierte nicht mehr. Mein wichtigstes Ziel war deshalb, diese Engpässe zu beseitigen und die Bedienung insgesamt flüssiger zu machen.
- **Vollständige deutsche Oberfläche:** Da ich selbst auf Deutsch spiele, wollte ich eine optionale deutsche Lokalisierung mit den etablierten Begriffen aus Pathfinder 2E ergänzen, ohne die vorhandenen Sprachen zu ersetzen.
- **Hilfen für neue Spieler:** Eigene Starter- und Klassenausrüstungspakete lassen sich nun aus normalen PF2e-Gegenständen zusammenstellen. Bilder, Beschreibungen, Preis, Last und enthaltene Gegenstände bleiben dabei nachvollziehbar, damit neue Charaktere schneller und verständlicher ausgerüstet werden können.
- **Mehr Kontrolle für eigene Kampagnen:** Herkünfte können wie Abstammungen empfohlen, eingeschränkt oder ausgeschlossen werden. Hinzu kommen verständlichere Hinweise bei Attributsverbesserungen sowie eine dokumentierte Import- und Exportfunktion für Charakterentwürfe.
- **Ein persönliches Hobbyprojekt:** Dieser Fork ist kein kommerzielles Produkt. Er ist entstanden, weil ich das Modul für meine eigenen Foundry-VTT-Runden verbessern wollte – und weil diese Änderungen vielleicht auch anderen Gruppen helfen.

### Was wurde geändert – und warum?

- **Flüssigere Tabwechsel:** Der Charakterassistent lädt für Listen bevorzugt schlanke Kompendiumsindizes statt vollständiger Dokumente. Bereits geladene Pakete und laufende Anfragen werden während der gesamten Foundry-Sitzung zwischen Assistenten geteilt. Hintergrunddaten werden priorisiert und nacheinander während Leerlaufzeiten geladen; aufwendige, schrittübergreifende Berechnungen werden bis zur nächsten tatsächlichen Charakteränderung wiederverwendet.
- **Bessere Steuerung vielseitiger Herkünfte:** Die SL-Ansicht besitzt eigene Filter für Abstammungsherkünfte und vielseitige Herkünfte sowie Sammelaktionen. Herkunftsregeln verwenden einen stabilen Herkunftsschlüssel, sodass beispielsweise ein verbotenes Dhampir aus einem Übersetzungs- oder Homebrew-Kompendium nicht als ungesperrte Kopie erneut auftaucht. SL dürfen verbotene Optionen weiterhin bewusst überschreiben.
- **Einrichtungsassistent für den SL:** Beim ersten Einsatz kann ein optionaler Assistent Sprache, Seltenheiten, Inhaltsquellen, Leveler-Regeln, erkannte PF2e-Varianten, Prüfanfragen und Spielerzugriff gemeinsam konfigurieren. Die Presets „Ausgewogen“, „Eingeschränkt“ und „Homebrew-freundlich“ dienen als Ausgangspunkt. Der Assistent bleibt über die Moduleinstellungen erneut erreichbar.
- **Kampagnenprofile und Diagnose:** Die relevante Leveler- und PF2e-Konfiguration kann als JSON-Profil zwischen Welten übertragen werden. Eine Diagnose erkennt fehlende Kompendien, veraltete Inhaltsverweise, fehlende Gegenstände in Ausrüstungspaketen, doppelte Herkunftsschlüssel und widersprüchliche Prüfeinstellungen. Laufzeit-Caches lassen sich dort sicher leeren.
- **Kampagnenregeln für Spieler:** Die Zusammenfassung der Charaktererschaffung zeigt die aktiven Zugriffs- und Variantenregeln, damit Spieler vor dem Anwenden erkennen, welche Inhalte und optionalen Regeln in der Welt gelten.

- **Schnellere Suche:** Die alte Suchlogik konnte bereits nach einem einzelnen Zeichen große Kompendien vollständig durchsuchen und Tausende DOM-Elemente erzeugen. Suchvorgänge beginnen nun erst ab drei Zeichen, werden um 250 ms verzögert und veraltete asynchrone Ergebnisse werden verworfen. Ausrüstung, Talente und Zauber zeigen höchstens 200 Ergebniszeilen gleichzeitig an. Unveränderliche Ausrüstungsfilter werden zwischengespeichert und mehrere Zauberkompendien parallel geladen.
- **Eigene Schnellausrüstungspakete:** Spielleiter können wiederverwendbare Pakete mit Name, Bild, Beschreibung, Klasse, Stufe, Seltenheit und Merkmalen erstellen. Ein Paket enthält Verweise auf normale PF2e-Gegenstände; Preis und Last werden automatisch aus Inhalt und Menge berechnet. Dadurch lassen sich vollständige Klassenausrüstungen verwalten, statt lediglich einen einzelnen Abenteurerrucksack anzubieten.
- **Herkünfte in den Inhaltsvorgaben:** Standardherkünfte, vielseitige Herkünfte, gemischte Abstammungen sowie Herkünfte aus Welten und Modulen können wie Abstammungen empfohlen, eingeschränkt oder verboten werden. Das schließt eine Lücke bei der Steuerung erlaubter Kampagneninhalte.
- **Verständlichere Attributsverbesserungen:** Der entsprechende Schritt erklärt nun Verbesserungen, Attributsschwächen und die alternative Abstammungsregel. Eine dynamische Anzeige zeigt außerdem, wie viele der vier freien Attributsverbesserungen noch zu vergeben sind.
- **Optionale deutsche Oberfläche:** Deutsch wurde als zusätzliche Sprache ergänzt. Englisch, Französisch und Chinesisch bleiben verfügbar. Die Übersetzung verwendet PF2e-Begriffe wie „Abstammung“, „Herkunft“, „Attributsverbesserung“, „Fertigkeitsverbesserung“, „Last“ und „Zaubergrad“.
- **Stabilitätskorrekturen:** Suchläufe unterhalb der Mindestlänge lösen keine vollständigen Neuberechnungen mehr aus. Ergebnislisten bleiben begrenzt, und ein bereits geschlossenes Ausrüstungsfenster wird nach einem verspäteten Kompendium-Ladevorgang nicht erneut gerendert.
- **Galerie-Ansicht und Bildvorschau:** Der Abstammungsschritt im Charaktererschaffungs-Assistenten sowie die Abstammungs- und Herkunfts-Inhaltsvorgaben in der SL-Verwaltung lassen sich zwischen einer kompakten Liste und einer Galerie mit großen Bildern umschalten; die gewählte Ansicht wird pro Benutzer gemerkt. Zusätzlich zeigt das Bewegen der Maus über ein Bild in allen Auswahllisten (Abstammungen, Herkünfte, Talente, Zauber, Ausrüstung, SL-Inhaltsvorgaben) eine vergrößerte Vorschau neben dem Mauszeiger.
- **Korrekturen aus gemeldeten Upstream-Issues:** Deutsche Fertigkeitsvoraussetzungen wie „Geübt in Athletik“ und „Experte in Heilkunde“ werden korrekt erkannt; Abstammungs- und Homebrew-Herkunftsvoraussetzungen lassen sich gemeinsam prüfen. Beim Zeit-Orakel verleiht **Advanced Revelation** jetzt korrekt **Time Skip** statt **Manifold Lives**, während **Greater Revelation** weiterhin Manifold Lives verleiht. Die Leveler-Schaltflächen sind robuster gegen Sheet-Themes und UI-Module; zusätzlich öffnet das frei belegbare Foundry-Tastenkürzel **Umschalt+L** den Leveler für einen ausgewählten oder zugewiesenen Charakter.

Namen und Beschreibungen von Talenten, Zaubern, Gegenständen und anderen Spielinhalten stammen aus den aktiven PF2e-/SF2e-Kompendien. Für übersetzte Spielinhalte muss zusätzlich eine passende System- oder Kompendiumsübersetzung aktiv sein.

### Getestete Umgebung

- Foundry VTT 14, Build 3654 sowie Build 14.365
- Pathfinder Second Edition 8.3.0

Die Moduldefinition unterstützt weiterhin Foundry VTT ab Version 13 sowie PF2e ab 7.0.0. Die oben genannten Versionen bezeichnen die konkret getestete Kombination.

### Anforderungen

- Foundry VTT 13 oder neuer
- Pathfinder Second Edition 7.0.0 oder neuer; alternativ Starfinder Second Edition 0.0.10 oder neuer
- `socketlib` wird für die zuverlässige Übermittlung von Prüfanfragen empfohlen

### Geplantes Feature: Homebrew-Götter

Geplant ist eine eigenständige Homebrew-Götter-Erweiterung mit Verbindung zu PF2e Leveler. Das vorgesehene technische Modell ist ein separates Foundry-Modul, das kompatible PF2e-Gegenstände vom Typ `deity` über ein Kompendium bereitstellt. PF2e Leveler soll dieses Kompendium anschließend als Gottheitenquelle verwenden können; Standardgottheiten sollen sich über Kompendiums- und Inhaltsvorgaben aus der Auswahl entfernen lassen.

Dies ist ein Roadmap-Eintrag und **noch nicht Bestandteil dieser Version**.

### Installation

1. Öffne in Foundry VTT **Zusatzmodule** und anschließend **Modul installieren**.
2. Füge diese Adresse unter **Manifest-URL** ein:

   ```text
   https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler/releases/latest/download/module.json
   ```

3. Klicke auf **Installieren** und aktiviere anschließend **Darkis Better PF2e-Leveler** in deiner Welt.

Die Manifest-URL verweist immer auf die neueste veröffentlichte Version dieses Forks.

Darkis Better PF2e-Leveler verwendet eine eigene Modul-ID und erscheint deshalb als eigenständiger Eintrag neben dem Original in Foundrys Modulliste. Aktiviere pro Welt nur eines der beiden Module.

### Charaktererschaffung exportieren und importieren

Über **Export** am unteren Rand des Charaktererschaffungs-Assistenten wird der aktuelle Entwurf als `<Charaktername>-creation-plan.json` gespeichert. Diese Datei enthält die Auswahl des Assistenten, verändert den Charakterbogen aber nicht.

So lädst du einen Entwurf wieder:

1. Öffne den Charakter, für den du den Entwurf verwenden möchtest, und starte **Charakter erschaffen**.
2. Klicke unten im Assistenten auf **Import** und wähle eine zuvor exportierte JSON-Datei aus.
3. Der importierte Entwurf ersetzt die bisher gespeicherte Auswahl für den aktuell geöffneten Charakter. Prüfe alle Schritte, besonders Inhalte aus zusätzlichen Modulen oder eigenen Kompendien.
4. Erst wenn du auf der Zusammenfassungsseite die Charaktererschaffung bestätigst, werden Gegenstände und Auswahlmöglichkeiten auf den Charakter angewendet.

Der Import akzeptiert ausschließlich Charaktererschaffungspläne von PF2e Leveler; Stufenpläne verwenden eine andere Importfunktion. Module und Kompendien, aus denen der Entwurf Einträge referenziert, müssen in der Zielwelt aktiv und für den Benutzer zugänglich sein.

### SL-Einrichtung und Kampagnenprofile

Der Einrichtungsassistent öffnet sich für einen SL einmalig beim ersten Einsatz dieser Version und bleibt danach unter **Moduleinstellungen → PF2e Leveler → Einrichtungsassistent für SL** verfügbar. Die direkt im Assistenten gewählten Einstellungen werden erst mit **Speichern und abschließen** übernommen. Verknüpfte Detailverwaltungen für Inhaltsvorgaben, Kompendiumsquellen und Ausrüstungspakete besitzen weiterhin ihre eigenen Speichern-Schaltflächen. **Nicht automatisch anzeigen** schließt die Ersteinrichtung; der Assistent kann trotzdem jederzeit manuell geöffnet werden.

Über **Kampagnenprofil exportieren** werden relevante Leveler-Welteinstellungen, Inhaltsvorgaben, Kompendiumszuordnungen, Schnellausrüstungspakete und unterstützte PF2e-Varianten als JSON gespeichert. Ein importiertes Profil wird zunächst nur in den Assistenten geladen und erst beim Abschluss angewendet. Die Diagnose verändert keine Daten; nur **Laufzeit-Caches leeren** verwirft bereits geladene Listen, damit sie bei der nächsten Verwendung neu aufgebaut werden.

### Sprache auswählen

Deutsch ist optional und wird wie jede andere Foundry-Sprache in der Kernkonfiguration des jeweiligen Benutzers ausgewählt. Verfügbar bleiben Deutsch, Englisch, Französisch und Chinesisch. Der SL-Einrichtungsassistent bietet dieselbe Foundry-Sprachauswahl direkt an und lädt die Oberfläche nach einer Änderung neu. Die Auswahl gilt für die gesamte Foundry-Oberfläche des Benutzers und nicht ausschließlich für dieses Modul.

### Ursprung, Lizenz und Nutzung

- Ursprüngliches Projekt und Entwickler: [RoiLeaf – PF2e Leveler](https://github.com/roi007leaf/pf2e-leveler)
- Community-Fork: [Darkiyus/Darkis-Better-PF2e-Leveler](https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler)

Dieser Fork ist kein offizielles Release des ursprünglichen Entwicklers. Das ursprüngliche PF2e Leveler steht laut dessen README unter der MIT-Lizenz; dieser Fork wird ebenfalls unter der MIT-Lizenz veröffentlicht (siehe [`LICENSE`](LICENSE)). Der komplette Quellcode – übernommener wie eigenständig hinzugefügter – darf damit frei verwendet, verändert und weiterverbreitet werden, solange der Copyright- und Lizenzhinweis erhalten bleibt. Inhalte und Marken von Pathfinder, Foundry VTT oder anderen Drittprojekten sind davon ausgenommen und unterliegen weiterhin den Rechten ihrer jeweiligen Inhaber.

Der ursprüngliche Entwickler ist ausdrücklich eingeladen, einzelne oder alle Änderungen dieses Forks in das Originalprojekt zu übernehmen. Genau dieser offene Austausch ist einer der schönsten Aspekte gemeinschaftlicher Softwareentwicklung. 😊

Ich hoffe, die Verbesserungen helfen euch genauso wie meinen eigenen Runden. Viel Spaß beim Basteln, viele unvergessliche Pathfinder-Abenteuer und einen großartigen Pen-&-Paper-Abend! 🎲

---

## English

### Overview

Darkis Better PF2e-Leveler assists with character creation and level-up planning in Foundry VTT for Pathfinder Second Edition and Starfinder Second Edition. It focuses on responsive interaction, an optional German interface, and better control over campaign-specific content. The module runs under its own module ID, `darkis-better-pf2e-leveler`, making it a standalone Foundry module with its own namespace rather than a replacement for the original.

Foundry therefore lists Darkis Better PF2e-Leveler as its own entry, independent of the original PF2e Leveler. Both can be installed side by side; since both provide the same character creation and level-up planning, only one should be active per world to avoid duplicate buttons and menus.

**Note for previous testers of this fork:** Earlier releases (up to and including 3.8.5) used the module ID `pf2e-leveler`. After updating to this version, the module appears as a new, separate entry in Foundry's module list; module settings and module-owned data from the old installation are not carried over automatically. The old installation can then be disabled or removed.

### Why this fork?

First and foremost, a huge thank-you to **RoiLeaf**, the original developer of this module. ❤️ I liked the idea and the module itself so much that I immediately wanted to use PF2e Leveler in my own Pathfinder Second Edition campaigns. This fork builds on that work and would not exist without it.

While using the module in my own games, I found a few areas that I wanted to improve or expand:

- **Performance and stability:** Item searches could process very large compendiums after only a single typed character. This sometimes caused Foundry to slow down severely or made the interface stop responding. My primary goal was therefore to remove those bottlenecks and make the module feel smoother overall.
- **A complete German interface:** Because I play in German, I wanted to add an optional German localization using established Pathfinder 2E terminology without replacing any of the existing languages.
- **Help for new players:** Custom starter and class-equipment packages can now be assembled from normal PF2e items. Their images, descriptions, prices, Bulk, and included items remain visible, making it easier to equip new characters quickly and transparently.
- **More control for custom campaigns:** Heritages can be recommended, restricted, or excluded in the same way as ancestries. The fork also adds clearer ability-boost guidance and documents the import and export workflow for character-creation drafts.
- **A personal hobby project:** This fork is not a commercial product. I created it because I wanted to improve the module for my own Foundry VTT games—and because the same changes might be useful to other groups.

### What changed – and why?

- **Smoother tab changes:** Character-creation lists prefer lightweight compendium indexes over complete documents. Loaded packs and in-flight requests are shared between wizards for the complete Foundry session. Background data is loaded in priority order during browser idle time, while expensive cross-step calculations are reused until the character actually changes.
- **Better versatile-heritage control:** The GM view adds separate ancestry-heritage and versatile-heritage filters and bulk actions. Stable heritage keys make a rule apply to matching copies supplied by translation or homebrew compendiums. GMs retain their intentional override.
- **GM setup assistant:** An optional first-run assistant configures language, rarities, content sources, Leveler rules, detected PF2e variants, review requests, and player access in one place. Balanced, Restricted, and Homebrew-friendly presets provide starting points, and the assistant can be reopened from Module Settings.
- **Campaign profiles and diagnostics:** Relevant Leveler and PF2e configuration can be transferred between worlds as a JSON profile. Diagnostics report missing compendiums, stale guidance references, missing quick-package items, duplicate heritage slugs, conflicting review settings, and runtime cache status. The same page can safely clear those caches.
- **Campaign rules for players:** The Character Creation Summary displays active access and variant rules so players can see which content and optional rules govern the world before applying their character.

- **Faster search:** The previous search flow could scan large compendiums and create thousands of DOM elements after a single character. Searches now start at three characters, use a 250 ms debounce, and discard stale asynchronous results. Equipment, feat, and spell pickers render at most 200 result rows at once. Static equipment facets are cached, and multiple spell compendiums load in parallel.
- **Custom quick-equipment packages:** Game Masters can create reusable packages with a name, image, description, class, level, rarity, and traits. Each package references normal PF2e items, while price and Bulk are calculated automatically from its contents and quantities. This makes complete class loadouts possible instead of exposing only an adventurer's pack.
- **Heritages in content guidance:** Standard, versatile, mixed-ancestry, world, and module heritages can be suggested, restricted, or banned in the same way as ancestries. This closes a gap in campaign content control.
- **Clearer ability boosts:** The ability-boost step now explains boosts, ancestry flaws, and the alternate ancestry rule. A live counter also shows how many of the four free boosts remain.
- **Optional German interface:** German is an additional language, not a replacement. English, French, and Chinese remain available. The German wording follows established PF2e terminology.
- **Stability fixes:** Queries below the minimum length no longer trigger full list rebuilds. Result lists remain bounded, and an equipment picker that has already been closed is not rendered again after a delayed compendium load completes.
- **Gallery view and image preview:** The ancestry step in the character-creation wizard, along with the ancestry and heritage content guidance in GM administration, can switch between a compact list and a large-image gallery; the chosen view is remembered per user. Hovering over any image in the selection lists (ancestries, heritages, feats, spells, equipment, GM content guidance) also shows an enlarged preview next to the cursor.
- **Fixes for reported upstream issues:** German proficiency prerequisites such as “Geübt in Athletik” and “Experte in Heilkunde” are recognized correctly, while ancestry and homebrew-heritage prerequisites can be checked together. The Time Oracle's **Advanced Revelation** now grants **Time Skip** instead of **Manifold Lives**, with Manifold Lives reserved for **Greater Revelation**. Leveler sheet controls are more resistant to sheet themes and UI modules, and the editable Foundry shortcut **Shift+L** opens the Leveler for a selected or assigned character.

Feat, spell, item, and other game-content names and descriptions come from the active PF2e/SF2e compendiums. A matching system or compendium translation is therefore required for translated game content.

### Tested environment

- Foundry VTT 14, Build 3654 and Build 14.365
- Pathfinder Second Edition 8.3.0

The manifest continues to support Foundry VTT 13 or newer and PF2e 7.0.0 or newer. The versions above identify the combination that was explicitly tested.

### Requirements

- Foundry VTT 13 or newer
- Pathfinder Second Edition 7.0.0 or newer; alternatively, Starfinder Second Edition 0.0.10 or newer
- `socketlib` is recommended for reliable review-request delivery

### Planned feature: homebrew deities

A separate homebrew deity add-on with PF2e Leveler integration is planned. The intended technical model is a companion Foundry module that provides compatible PF2e `deity` items in a compendium. PF2e Leveler can then use that compendium as a deity source, while standard deities can be removed from the available selection through compendium and content-guidance configuration.

This is a roadmap item and is **not included in the current version**.

### Installation

1. In Foundry VTT, open **Add-on Modules** and select **Install Module**.
2. Enter this address in the **Manifest URL** field:

   ```text
   https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler/releases/latest/download/module.json
   ```

3. Select **Install**, then enable **Darkis Better PF2e-Leveler** in your world.

The manifest URL always points to the latest published version of this fork.

Darkis Better PF2e-Leveler uses its own module ID and therefore appears as a separate entry alongside the original in Foundry's module list. Enable only one of the two modules per world.

### Exporting and importing character creation

Select **Export** in the footer of the character-creation wizard to save the current draft as `<character-name>-creation-plan.json`. The file contains the wizard selections but does not modify the actor sheet.

To restore a draft:

1. Open the actor that should receive the draft and start **Character Creation**.
2. Select **Import** in the wizard footer and choose a previously exported JSON file.
3. The imported draft replaces the saved wizard selections for the currently open actor. Review every step, especially content supplied by add-on modules or custom compendiums.
4. Items and choices are applied to the actor only after you confirm character creation on the Summary step.

This import accepts PF2e Leveler character-creation plans only; level plans use their separate import function. Any module or compendium referenced by the draft must be active in the target world and accessible to the user.

### GM setup and campaign profiles

The setup assistant opens once for a GM on the first use of this version and remains available under **Module Settings → PF2e Leveler → GM Setup Assistant**. Settings selected directly in the assistant are applied through **Save and Finish**. Linked detail managers for content guidance, compendium sources, and equipment packages retain their own Save buttons. **Do not show automatically** dismisses first-run setup; the assistant can still be opened manually at any time.

**Export Campaign Profile** saves relevant Leveler world settings, content guidance, compendium assignments, quick-equipment packages, and supported PF2e variants as JSON. An imported profile is loaded into the assistant draft and is applied only after finishing. Diagnostics are read-only; only **Clear Runtime Caches** discards loaded lists so they can be rebuilt on demand.

### Languages

German is optional and can be selected through each user's Foundry core language setting. German, English, French, and Chinese remain available. The GM setup assistant exposes the same Foundry language setting and reloads the interface after a change. The selected language applies to that user's complete Foundry interface, not only this module.

### Origin, license, and use

- Original project and developer: [RoiLeaf – PF2e Leveler](https://github.com/roi007leaf/pf2e-leveler)
- Community fork: [Darkiyus/Darkis-Better-PF2e-Leveler](https://github.com/Darkiyus/Darkis-Better-PF2e-Leveler)

This community fork is not an official release by the original developer. The original PF2e Leveler is MIT-licensed per its README, and this fork is likewise released under the MIT License (see [`LICENSE`](LICENSE)). That covers the complete source code, inherited and original alike: free to use, modify, and redistribute as long as the copyright and license notice is retained. Pathfinder, Foundry VTT, and other third-party content or trademarks are excluded and remain subject to the rights of their respective owners.

The original developer is warmly invited to incorporate any or all of these changes into the original project. That kind of open exchange is one of the best parts of collaborative software development. 😊

I hope these improvements help your games as much as they have helped mine. Have fun tinkering, enjoy many unforgettable Pathfinder adventures, and have a fantastic tabletop night! 🎲
