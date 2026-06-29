# Issue #82 follow-ups — combined design

Design for the four deferred items from
[#82](https://github.com/roi007leaf/pf2e-leveler/issues/82). The quick-win UX
items (#1, #2, #3, #7, #9, and the #5 GM gear shortcut) already shipped in 3.5.7.

This is one combined design pass; it produces one spec and (next) one
implementation plan. Suggested build order: **#4 → #8 → #5b → #6** (smallest and
most-coupled first, heaviest/standalone last).

## Decisions locked during brainstorming

- **#8** ships only what's derivable with zero maintenance in v1 — a Remaster
  filter and a No-Guns/Tech exclusion. Heuristic groupings (Adventure Paths, AP
  Player's Guides, Organized Play, Blogs, Stand-Alone Adventures) are **out of
  scope for v1** (see Future work).
- **#6** is **non-blocking** (no approval-override). The "Request GM review"
  affordance appears on **any** item, not just disallowed ones. Requests are
  delivered by socket to the active GM and persisted in a world-setting store,
  surfaced in a GM review panel.

---

## Shared foundation: source classification helper

A small new module (`scripts/access/source-classification.js`) is the single
source of truth consumed by #4 and #8 so each picker and the character wizard
don't reimplement source logic:

- `isPublicationDisallowed(title)` — true when the source's `source-title:<title>`
  guidance entry resolves to `disallowed` (reuses `getSourceGuidanceKey` /
  `getRawGuidanceEntry` from `content-guidance.js`).
- `isRemasterItem(item)` — reads `system.publication.remaster` (boolean; confirmed
  present in the PF2e publication schema).
- `NO_GUNS_TRAITS` — the trait set used by the No-Guns/Tech exclusion, defined in
  one place so it's tunable (initial: `firearm`, `tech`; revisit `gadget`).
- `itemHasExcludedTechTrait(item)` — true when the item carries any `NO_GUNS_TRAITS`.

Publication option building is currently duplicated (`buildPublicationOptions`
in `scripts/ui/character-wizard/index.js` and each picker's `publicationOptions`).
This design routes the disallowed-source filtering (#4) through the shared helper;
it does **not** otherwise refactor that duplication beyond what #4 needs.

---

## #4 — Hide disallowed sources from the publication filter

**Setting.** New world setting `publicationFilterVisibility` (enum), registered in
`scripts/settings.js`:

- `show` — default; current behaviour, every source listed.
- `hide` — disallowed-source publications are omitted from the filter list for
  everyone.
- `hide-non-gm` — omitted for non-GMs; GMs still see them.

**Behaviour.** When building publication options, drop entries where
`isPublicationDisallowed(title)` is true, gated by the setting and `game.user.isGM`.
This affects **only the filter list** — items from disallowed sources are already
excluded from results by existing guidance resolution, so this is purely
de-cluttering. No change to item filtering.

**Touchpoints.** `settings.js`, the shared helper, the publication-option
builders in the three pickers and the character wizard.

---

## #8 — Remaster filter + No-Guns/Tech exclusion (derivable-only)

Two independent toggles in the picker filter sidebars, each a simple on/off
control — not a new source group list. Scoped to the three pickers in v1 (the main
item-browsing surfaces); the character-wizard / level-planner grids are a future
extension.

- **Remaster only** — when on, restrict results to items where
  `isRemasterItem(item)` is true. Pure item-metadata check, zero maintenance.
- **Hide Guns/Tech** — when on, exclude items where `itemHasExcludedTechTrait(item)`
  is true. Trait-based, more accurate than tagging sources.

Both are normal filter predicates that AND with everything else in
`_applyFilters` / `_filterItems`. State is per-picker UI state (no setting).
Default off.

**Touchpoints.** Each picker's filter method + `_prepareContext` + template; the
shared helper.

---

## #5b — Filter pickers by guidance tag

A chip group in each picker sidebar: **Suggested / Allowed / Not Recommended /
Disallowed**. Multi-select; ANDs with all other filters. Each item already carries
`isRecommended` / `isAllowed` / `isNotRecommended` / `isDisallowed` from
`applyResolvedStatus`, so the filter is a straight predicate.

- Default: all chips off (no implicit filtering).
- The **Disallowed** chip is shown to **GMs only** (players generally never see
  disallowed items).
- Centralize the predicate (e.g. `matchesGuidanceTagFilter(item, selected)`) so
  all three pickers share one implementation.

**Touchpoints.** Each picker's filter method + `_prepareContext` + template + a
shared predicate helper; new i18n keys for the chip labels.

---

## #6 — Player → GM review request (non-blocking, socket + world-setting)

**User flow**

1. Every item row in the pickers gets a small **"Request GM review"** icon button
   (next to the existing chat button), shown to **non-GMs**.
2. Click → a `DialogV2` with an optional note ("why / context for the GM").
3. On submit the client calls `game.socket.emit('module.pf2e-leveler', payload)`
   with `{ type: 'review-request', itemUuid, itemName, actorId, actorName,
   requesterUserId, requesterName, note, ts }` (ts passed in, not generated in a
   pure function).
4. The **responsible GM only** (`game.users.activeGM` — single writer to avoid
   duplicate writes when several GMs are online) handles the socket event, appends
   the request to the `reviewRequests` world setting, and shows a toast.
5. A **GM review panel** (`ApplicationV2`) lists requests with requester,
   character, item link, note, timestamp, and status. The GM opens it from a
   button in the module settings; the receipt toast is informational only. The GM
   can mark each **resolved** or **dismissed** (status update written to the
   setting). Nothing is ever blocked or auto-applied.

**Data.** `reviewRequests` world setting: an array of request records, each
`{ id, ts, status: 'pending' | 'resolved' | 'dismissed', requesterUserId,
requesterName, actorId, actorName, itemUuid, itemName, note }`.

**No-GM-online fallback.** If `game.users.activeGM` is null when the player
submits, the socket has no receiver. The player is notified ("No GM is online —
your request was logged and will be delivered"), and as a safety net the request
is also written as a GM-whisper `ChatMessage` flagged for the module, so it is not
lost; the GM panel folds in any such orphaned whispers on next open. (This is the
one fragile area; it's intentionally degraded-but-safe rather than silent loss.)

**Touchpoints.** Socket registration in `scripts/main.js`; new world setting +
registration; new GM panel app + template; a request dialog; the request button
on picker rows; i18n for dialog/panel/notification strings.

---

## Settings & i18n

- New world settings: `publicationFilterVisibility` (#4, choice),
  `reviewRequests` (#6, object/array, GM-written, hidden from the config UI).
- New i18n keys: filter-visibility setting name/hint/choices (#4); Remaster and
  Guns/Tech toggle labels (#8); guidance-tag chip labels (#5b); review
  dialog/panel/notification strings (#6). All literal template keys are covered by
  the existing `i18n-template-keys` guard test.

## Testing

- **Shared helper** — unit tests for `isPublicationDisallowed`, `isRemasterItem`,
  `itemHasExcludedTechTrait` (mock `system.publication` / traits / guidance).
- **#4** — publication-option builder omits disallowed sources per setting +
  role.
- **#8** — filter predicates include/exclude on remaster flag and tech traits.
- **#5b** — tag predicate filters correctly; Disallowed chip hidden for non-GM.
- **#6** — request record shape; `activeGM` single-writer guard; status
  transitions; no-GM fallback path. Socket/dialog wiring is integration-level and
  verified manually in Foundry.
- i18n guard stays green.

Manual Foundry verification required for all visual/socket behaviour (no live
Foundry in CI).

## Out of scope / future work

- **#8 heuristic groups** — Adventure Paths, AP Player's Guides, Organized Play,
  Blogs, Stand-Alone Adventures. No reliable metadata; revisit with title
  heuristics or a community-maintained map.
- **#6 approval-override** — a GM "approve" that writes a per-actor guidance
  override making an item selectable for one character. Deliberately excluded to
  keep v1 non-blocking.
- Exposing the #8 toggles inside the character-wizard/level-planner item grids if
  v1 scopes them to the pickers only.
