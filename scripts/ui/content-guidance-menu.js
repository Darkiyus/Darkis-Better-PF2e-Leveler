import { MODULE_ID, SKILLS } from '../constants.js';
import { getCompendiumKeysForCategory } from '../compendiums/catalog.js';
import {
  buildGuidanceEntry,
  CATEGORY_DEFAULT_POLICIES,
  getCategoryDefaultGuidanceKey,
  getContentGuidance,
  getGuidanceKeyForItem,
  getPlayerDisallowedContentMode,
  getSourceGuidanceKey,
  invalidateGuidanceCache,
  normalizeGuidanceEntry,
  PLAYER_DISALLOWED_CONTENT_MODES,
} from '../access/content-guidance.js';
import { getLanguageMap, getLanguageRarityMap } from './character-wizard/skills-languages.js';
import { PUBLICATION_GROUPS, getPublicationGroupMembers } from '../access/source-classification.js';
import { getActiveSearchQuery, scheduleSearch } from './shared/search-utils.js';
import { createMixedAncestryHeritage } from '../heritages/mixed-ancestry.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const GUIDANCE_CATEGORIES = [
  { key: 'ancestries', type: 'ancestry' },
  { key: 'heritages', type: 'heritage' },
  { key: 'backgrounds', type: 'background' },
  { key: 'classes', type: 'class' },
  {
    key: 'classArchetypes',
    type: 'feat',
    compendiumCategory: 'feats',
    labelKey: 'PF2E_LEVELER.SETTINGS.COMPENDIUM_CATEGORIES.CLASS_ARCHETYPES',
    matches: isClassArchetypeFeat,
  },
  { key: 'sources', type: null, labelKey: 'PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.SOURCES' },
  { key: 'skills', type: null },
  { key: 'languages', type: null },
];

const DEFAULT_GUIDANCE_STATUS_CYCLE = ['default', 'recommended', 'not-recommended', 'disallowed'];
const ALLOWLIST_GUIDANCE_STATUS_CYCLE = ['default', 'allowed', 'recommended', 'not-recommended', 'disallowed'];
const BULK_GUIDANCE_STATES = ['recommended', 'not-recommended', 'disallowed', 'default'];
const ALLOWLIST_BULK_GUIDANCE_STATES = ['allowed', ...BULK_GUIDANCE_STATES];
const ORPHAN_ARCHETYPE_BULK_STATES = ['disallowed', 'default'];
const VALID_BULK_GUIDANCE_STATES = new Set(ALLOWLIST_BULK_GUIDANCE_STATES);
const ORPHAN_ARCHETYPE_NO_PREREQS_SCOPE = 'orphanArchetypeNoPrerequisites';
const CATEGORY_DEFAULT_OPTIONS = [CATEGORY_DEFAULT_POLICIES.ALLOWED, CATEGORY_DEFAULT_POLICIES.DISALLOWED];
const SOURCE_SCAN_CATEGORIES = [
  ['ancestries', (doc) => doc.type === 'ancestry'],
  ['heritages', (doc) => doc.type === 'heritage'],
  ['backgrounds', (doc) => doc.type === 'background'],
  ['classes', (doc) => doc.type === 'class'],
  ['feats', (doc) => doc.type === 'feat'],
  ['spells', (doc) => doc.type === 'spell'],
  ['equipment', (doc) => ['weapon', 'armor', 'equipment', 'consumable', 'ammo', 'treasure', 'backpack', 'shield', 'kit'].includes(String(doc?.type ?? '').toLowerCase())],
  ['actions', (doc) => doc.type === 'action'],
  ['deities', (doc) => doc.type === 'deity'],
];
const GUIDANCE_INDEX_FIELDS = [
  'img',
  'type',
  'slug',
  'system.slug',
  'system.category',
  'system.level.value',
  'system.traits.value',
  'system.traits.otherTags',
  'system.traits.rarity',
  'system.ancestry.slug',
  'system.publication.title',
  'system.prerequisites.value',
];

export function openContentGuidanceMenu() {
  return new ContentGuidanceMenu().render(true);
}

export class ContentGuidanceMenu extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.activeCategory = 'ancestries';
    this.searchText = '';
    this.classArchetypesDedicationsOnly = true;
    this.heritageView = 'all';
    this.previewAsPlayer = false;
    this._draft = null;
    this._itemCache = {};
    this._pendingScrollTop = null;
  }

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-content-guidance`,
    classes: ['pf2e-leveler', 'pf2e-leveler-compendium-app'],
    position: { width: 980, height: 760 },
    window: { resizable: true },
  };

  static PARTS = {
    settings: {
      template: `modules/${MODULE_ID}/templates/content-guidance-menu.hbs`,
    },
  };

  get title() {
    return game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.NAME');
  }

  async _prepareContext() {
    if (!this._draft) {
      this._draft = foundry.utils.deepClone(getContentGuidance());
    }

    const loadedItems = await this._loadCategoryItems(this.activeCategory);
    const items = this._filterActiveCategoryItems(loadedItems);

    const categories = GUIDANCE_CATEGORIES.map((cat) => {
      const label = game.i18n.localize(cat.labelKey ?? `PF2E_LEVELER.SETTINGS.COMPENDIUM_CATEGORIES.${cat.key.toUpperCase()}`);
      const count = Object.entries(this._draft).filter(([uuid]) => {
        if (uuid === getCategoryDefaultGuidanceKey(cat.key)) return true;
        if (cat.key === 'sources') return String(uuid).startsWith('source-title:');
        const cached = this._findCachedItem(uuid);
        return cached?.categoryKey === cat.key;
      }).length;
      return {
        key: cat.key,
        label,
        active: cat.key === this.activeCategory,
        markedCount: count,
      };
    });

    const totalMarked = Object.keys(this._draft).length;

    const displayItems = items.map((item) => {
      const resolved = this._resolveDraftStatus(item);
      return {
      uuid: item.uuid,
      guidanceKey: getGuidanceKeyForItem(item),
      name: item.name,
      img: item.img,
      ancestrySlug: item.ancestrySlug ?? null,
      ancestryLabel: item.ancestryLabel ?? null,
      publicationTitle: item.publicationTitle ?? null,
      openable: isOpenableItemUuid(item.uuid),
      rarity: item.rarity ?? 'common',
      level: item.level ?? null,
      matchedCount: item.matchedCount ?? null,
      categorySummary: item.categorySummary ?? null,
      status: resolved.status ?? 'default',
      isAllowed: resolved.status === 'allowed',
      isRecommended: resolved.status === 'recommended',
      isNotRecommended: resolved.status === 'not-recommended',
      isDisallowed: resolved.status === 'disallowed',
      isExclusive: resolved.exclusive === true,
      isFreeArchetypeExclusive: resolved.freeArchetypeExclusive === true,
      showFreeArchetypeExclusiveControls: this.activeCategory === 'classArchetypes',
      guidanceInherited: resolved.inherited,
      previewBlocked: this.previewAsPlayer && resolved.status === 'disallowed',
    };
    });
    const playerMode = getPlayerDisallowedContentMode();
    const previewItems = this.previewAsPlayer && playerMode === PLAYER_DISALLOWED_CONTENT_MODES.HIDDEN
      ? displayItems.filter((item) => !item.isDisallowed)
      : displayItems;
    const categoryDefaultPolicy = this._getCategoryDefaultPolicy(this.activeCategory);

    return {
      categories,
      primaryCategories: categories.filter((category) => category.key !== 'sources'),
      secondaryCategories: categories.filter((category) => category.key === 'sources'),
      items: previewItems,
      useGridLayout: this.activeCategory !== 'heritages',
      searchText: this.searchText,
      totalMarked,
      countLabel: game.i18n.format('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.COUNT', { count: totalMarked }),
      intro: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.INTRO'),
      searchPlaceholder: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.SEARCH'),
      categoryDefaultPolicy,
      categoryDefaultOptions: CATEGORY_DEFAULT_OPTIONS.map((policy) => ({
        value: policy,
        active: policy === categoryDefaultPolicy,
        label: game.i18n.localize(`PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.DEFAULT_${policy.toUpperCase()}`),
      })),
      showClassArchetypeModeFilter: this.activeCategory === 'classArchetypes',
      classArchetypesDedicationsOnly: this.classArchetypesDedicationsOnly,
      classArchetypeModeOptions: [
        {
          value: 'dedications',
          active: this.classArchetypesDedicationsOnly,
          label: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.CLASS_ARCHETYPE_DEDICATIONS'),
        },
        {
          value: 'all',
          active: !this.classArchetypesDedicationsOnly,
          label: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.CLASS_ARCHETYPE_ALL_FEATS'),
        },
      ],
      showHeritageModeFilter: this.activeCategory === 'heritages',
      heritageModeOptions: [
        { value: 'all', active: this.heritageView === 'all', label: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.HERITAGE_VIEW_ALL') },
        { value: 'ancestry', active: this.heritageView === 'ancestry', label: game.i18n.localize('PF2E_LEVELER.CREATION.HERITAGE_GROUP_ANCESTRY') },
        { value: 'versatile', active: this.heritageView === 'versatile', label: game.i18n.localize('PF2E_LEVELER.CREATION.HERITAGE_GROUP_VERSATILE') },
      ],
      previewAsPlayer: this.previewAsPlayer,
      previewModeLabel: game.i18n.localize(`PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.PLAYER_DISALLOWED_MODE.${playerMode.toUpperCase()}`),
      rarityBulkGroups: this._buildRarityBulkGroups(items),
      publicationGroupBulkGroups: this._buildPublicationGroupBulkGroups(items),
      specialBulkGroups: this._buildSpecialBulkGroups(items),
      groupedItems: this.activeCategory === 'heritages' ? this._buildHeritageGroups(previewItems) : null,
    };
  }

  _findCachedItem(uuid) {
    for (const [categoryKey, items] of Object.entries(this._itemCache)) {
      if (!Array.isArray(items)) continue;
      const found = items.find((item) => item.uuid === uuid || getGuidanceKeyForItem(item) === uuid);
      if (found) return { ...found, categoryKey };
    }
    return null;
  }

  async _loadCategoryItems(categoryKey) {
    if (this._itemCache[categoryKey]) return this._itemCache[categoryKey];

    const catDef = GUIDANCE_CATEGORIES.find((c) => c.key === categoryKey);
    if (!catDef) return [];

    if (categoryKey === 'skills') {
      const items = SKILLS.map((slug) => {
        const raw = globalThis.CONFIG?.PF2E?.skills?.[slug];
        const label = typeof raw === 'string' ? raw : (raw?.label ?? slug);
        const localized = game.i18n?.has?.(label) ? game.i18n.localize(label) : slug.charAt(0).toUpperCase() + slug.slice(1);
        return { uuid: `skill:${slug}`, name: localized, img: null, rarity: 'common', level: null };
      });
      this._itemCache[categoryKey] = items;
      return items;
    }

    if (categoryKey === 'languages') {
      const rarityMap = getLanguageRarityMap();
      const langMap = getLanguageMap();
      const items = Object.entries(langMap)
        .map(([slug, label]) => ({ uuid: `language:${slug}`, name: label, img: null, rarity: rarityMap[slug] ?? 'common', level: null }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this._itemCache[categoryKey] = items;
      return items;
    }

    if (categoryKey === 'sources') {
      const items = await this._loadSourceItems();
      this._itemCache[categoryKey] = items;
      return items;
    }

    const keys = getCompendiumKeysForCategory(catDef.compendiumCategory ?? catDef.key);
    const documents = [];
    for (const key of keys) {
      const pack = game.packs.get(key);
      if (!pack) continue;
      const docs = await loadGuidancePackEntries(pack, key);
      documents.push(...docs);
    }

    documents.push(...getAllWorldItems());
    if (categoryKey === 'heritages') documents.push(createMixedAncestryHeritage());

    const items = dedupeGuidanceItems(documents
      .filter((doc) => doc.type === catDef.type && (typeof catDef.matches !== 'function' || catDef.matches(doc)))
      .map(toGuidanceItem));

    items.sort((a, b) => a.name.localeCompare(b.name));
    if (categoryKey === 'heritages') {
      const ancestryLabels = await this._loadAncestryLabels();
      for (const item of items) {
        item.ancestrySlug ??= inferHeritageAncestrySlug(item, ancestryLabels);
        item.ancestryLabel = ancestryLabels.get(item.ancestrySlug ?? '') ?? humanizeSlug(item.ancestrySlug) ?? null;
      }
    }
    this._itemCache[categoryKey] = items;
    return items;
  }

  _onRender() {
    const root = this.element;
    if (!root) return;

    root.querySelectorAll('[data-action="select-category"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        if (category && category !== this.activeCategory) {
          this.activeCategory = category;
          this.searchText = '';
          this._showCategoryLoading(btn);
          this._rerenderPreservingScroll({ resetScroll: true });
        }
      });
    });

    root.querySelectorAll('[data-action="cycle-guidance"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const guidanceKey = btn.dataset.guidanceKey ?? btn.dataset.uuid;
        if (!guidanceKey) return;
        const current = normalizeGuidanceEntry(this._draft[guidanceKey]).status ?? 'default';
        const cycle = this._getGuidanceStatusCycle();
        const currentIndex = cycle.includes(current) ? cycle.indexOf(current) : 0;
        const next = cycle[(currentIndex + 1) % cycle.length];
        this._setGuidanceStatus(guidanceKey, next);
        this._rerenderPreservingScroll();
      });
    });

    root.querySelectorAll('[data-action="toggle-exclusive-guidance"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const guidanceKey = btn.dataset.guidanceKey ?? btn.dataset.uuid;
        if (!guidanceKey) return;
        const current = normalizeGuidanceEntry(this._draft[guidanceKey]);
        this._setGuidanceExclusive(guidanceKey, !current.exclusive);
        this._rerenderPreservingScroll();
      });
    });

    root.querySelectorAll('[data-action="toggle-free-archetype-exclusive-guidance"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const guidanceKey = btn.dataset.guidanceKey ?? btn.dataset.uuid;
        if (!guidanceKey) return;
        const current = normalizeGuidanceEntry(this._draft[guidanceKey]);
        this._setGuidanceFreeArchetypeExclusive(guidanceKey, !current.freeArchetypeExclusive);
        this._rerenderPreservingScroll();
      });
    });

    root.querySelectorAll('[data-action="viewGuidanceItem"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uuid = btn.dataset.uuid;
        if (!uuid || !uuid.startsWith('Compendium.')) return;
        const item = await fromUuid(uuid).catch(() => null);
        item?.sheet?.render?.(true);
      });
    });

    root.querySelectorAll('[data-action="bulk-guidance"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const status = btn.dataset.status;
        const scopeType = btn.dataset.scopeType;
        const scopeValue = btn.dataset.scopeValue;
        if (!VALID_BULK_GUIDANCE_STATES.has(status) || !scopeType || !scopeValue) return;
        this._applyBulkGuidance(scopeType, scopeValue, status);
        this._rerenderPreservingScroll();
      });
    });

    root.querySelectorAll('[data-action="bulk-exclusive-guidance"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const exclusive = btn.dataset.exclusive === 'true';
        const scopeType = btn.dataset.scopeType;
        const scopeValue = btn.dataset.scopeValue;
        if (!scopeType || !scopeValue) return;
        this._applyBulkExclusive(scopeType, scopeValue, exclusive);
        this._rerenderPreservingScroll();
      });
    });

    root.querySelectorAll('[data-action="bulk-free-archetype-exclusive-guidance"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const freeArchetypeExclusive = btn.dataset.freeArchetypeExclusive === 'true';
        const scopeType = btn.dataset.scopeType;
        const scopeValue = btn.dataset.scopeValue;
        if (!scopeType || !scopeValue) return;
        this._applyBulkFreeArchetypeExclusive(scopeType, scopeValue, freeArchetypeExclusive);
        this._rerenderPreservingScroll();
      });
    });

    root.querySelectorAll('[data-action="set-category-default"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const policy = btn.dataset.policy;
        if (!CATEGORY_DEFAULT_OPTIONS.includes(policy)) return;
        this._setCategoryDefaultPolicy(policy);
        this._rerenderPreservingScroll();
      });
    });

    root.querySelectorAll('[data-action="set-class-archetype-mode"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (!['dedications', 'all'].includes(mode)) return;
        const nextDedicationsOnly = mode === 'dedications';
        if (nextDedicationsOnly === this.classArchetypesDedicationsOnly) return;
        this.classArchetypesDedicationsOnly = nextDedicationsOnly;
        this._rerenderPreservingScroll({ resetScroll: true });
      });
    });

    root.querySelectorAll('[data-action="set-heritage-mode"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (!['all', 'ancestry', 'versatile'].includes(mode) || mode === this.heritageView) return;
        this.heritageView = mode;
        this._rerenderPreservingScroll({ resetScroll: true });
      });
    });

    root.querySelector('[data-action="toggle-player-preview"]')?.addEventListener('click', () => {
      this.previewAsPlayer = !this.previewAsPlayer;
      this._rerenderPreservingScroll({ resetScroll: true });
    });

    root.querySelector('[data-action="search-guidance"]')?.addEventListener('input', (e) => {
      const input = e.currentTarget;
      this.searchText = input.value ?? '';
      scheduleSearch(input, () => this._applySearchFilterToList());
    });

    root.querySelector('[data-action="save-guidance"]')?.addEventListener('click', () => this._save());
    root.querySelector('[data-action="close-guidance"]')?.addEventListener('click', () => this.close());

    root.querySelector('[data-action="clear-all-guidance"]')?.addEventListener('click', () => {
      const categoryDefaultKey = getCategoryDefaultGuidanceKey(this.activeCategory);
      if (categoryDefaultKey) delete this._draft[categoryDefaultKey];
      for (const [uuid] of Object.entries(this._draft ?? {})) {
        if (this.activeCategory === 'sources' && String(uuid).startsWith('source-title:')) {
          delete this._draft[uuid];
          continue;
        }
        const cached = this._findCachedItem(uuid);
        if (cached?.categoryKey === this.activeCategory) delete this._draft[uuid];
      }
      this._rerenderPreservingScroll();
    });

    const searchInput = root.querySelector('[data-action="search-guidance"]');
    if (searchInput && searchInput.value !== this.searchText) {
      searchInput.value = this.searchText;
    }
    this._applySearchFilterToList();
    this._restoreScrollPosition();
  }

  _applySearchFilterToList() {
    const root = this.element;
    if (!root) return;
    const query = getActiveSearchQuery(this.searchText);
    root.querySelectorAll('.guidance-item').forEach((el) => {
      const name = el.querySelector('.guidance-item__name')?.textContent?.toLowerCase() ?? '';
      el.style.display = !query || name.includes(query) ? '' : 'none';
    });
  }

  async _save() {
    await game.settings.set(MODULE_ID, 'gmContentGuidance', this._draft ?? {});
    invalidateGuidanceCache();
    ui.notifications.info(game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.SAVED'));
    this.close();
  }

  _applyBulkGuidance(scopeType, scopeValue, status) {
    const items = this._getActiveBulkItems();
    const uuids = items
      .filter((item) => this._matchesBulkScope(item, scopeType, scopeValue))
      .map((item) => getGuidanceKeyForItem(item));

    for (const uuid of uuids) {
      this._setGuidanceStatus(uuid, status);
    }
  }

  _applyBulkExclusive(scopeType, scopeValue, exclusive) {
    const items = this._getActiveBulkItems();
    const uuids = items
      .filter((item) => this._matchesBulkScope(item, scopeType, scopeValue))
      .map((item) => getGuidanceKeyForItem(item));

    for (const uuid of uuids) {
      this._setGuidanceExclusive(uuid, exclusive);
    }
  }

  _applyBulkFreeArchetypeExclusive(scopeType, scopeValue, freeArchetypeExclusive) {
    const items = this._getActiveBulkItems();
    const uuids = items
      .filter((item) => this._matchesBulkScope(item, scopeType, scopeValue))
      .map((item) => getGuidanceKeyForItem(item));

    for (const uuid of uuids) {
      this._setGuidanceFreeArchetypeExclusive(uuid, freeArchetypeExclusive);
    }
  }

  _matchesBulkScope(item, scopeType, scopeValue) {
    if (!item) return false;
    if (scopeType === 'rarity') {
      return String(item.rarity ?? 'common').toLowerCase() === scopeValue;
    }
    if (scopeType === 'ancestry') {
      const ancestrySlug = String(item.ancestrySlug ?? '').toLowerCase();
      return scopeValue === 'versatile' ? !ancestrySlug : ancestrySlug === scopeValue;
    }
    if (scopeType === ORPHAN_ARCHETYPE_NO_PREREQS_SCOPE) {
      return isOrphanArchetypeNoPrerequisitesFeat(item) && this._matchesCurrentSearch(item);
    }
    if (scopeType === 'publicationGroup') {
      return getPublicationGroupMembers(scopeValue, [item.publicationTitle ?? item.name]).length > 0;
    }
    return false;
  }

  _getActiveBulkItems() {
    return this._filterActiveCategoryItems(this._itemCache[this.activeCategory] ?? []);
  }

  _filterActiveCategoryItems(items) {
    let filtered = items;
    if (this.activeCategory === 'classArchetypes' && this.classArchetypesDedicationsOnly) {
      filtered = filtered.filter((item) => isDedicationFeat(item));
    }
    if (this.activeCategory === 'heritages' && this.heritageView !== 'all') {
      filtered = filtered.filter((item) => this.heritageView === 'versatile' ? !item.ancestrySlug : !!item.ancestrySlug);
    }
    return filtered;
  }

  _resolveDraftStatus(item) {
    const guidanceKey = getGuidanceKeyForItem(item);
    const direct = normalizeGuidanceEntry(guidanceKey ? this._draft?.[guidanceKey] : null);
    if (direct.status || direct.exclusive || direct.freeArchetypeExclusive) return { ...direct, inherited: false };

    const legacyDirect = normalizeGuidanceEntry(item?.uuid && item.uuid !== guidanceKey ? this._draft?.[item.uuid] : null);
    if (legacyDirect.status || legacyDirect.exclusive || legacyDirect.freeArchetypeExclusive) {
      return { ...legacyDirect, inherited: false };
    }

    const sourceKey = getSourceGuidanceKey(item?.publicationTitle ?? item?.name ?? '');
    const inherited = normalizeGuidanceEntry(sourceKey ? this._draft?.[sourceKey] : null);
    if (inherited.status || inherited.exclusive || inherited.freeArchetypeExclusive) {
      return { ...inherited, inherited: item?.uuid !== sourceKey };
    }

    if (sourceKey && this._getCategoryDefaultPolicy('sources') === CATEGORY_DEFAULT_POLICIES.DISALLOWED) {
      return { status: 'disallowed', exclusive: false, freeArchetypeExclusive: false, inherited: item?.uuid !== sourceKey };
    }

    if (this._getCategoryDefaultPolicy(this.activeCategory) === CATEGORY_DEFAULT_POLICIES.DISALLOWED) {
      return { status: 'disallowed', exclusive: false, freeArchetypeExclusive: false, inherited: true };
    }

    return { status: null, exclusive: false, freeArchetypeExclusive: false, inherited: false };
  }

  async _loadSourceItems() {
    const aggregated = new Map();

    for (const [categoryKey, matcher] of SOURCE_SCAN_CATEGORIES) {
      const docs = await this._loadSourceDocumentsForCategory(categoryKey, matcher);
      for (const doc of docs) {
        const title = String(doc?.system?.publication?.title ?? '').trim();
        if (!title) continue;
        const sourceKey = getSourceGuidanceKey(title);
        if (!sourceKey) continue;
        if (!aggregated.has(sourceKey)) {
          aggregated.set(sourceKey, {
            uuid: sourceKey,
            name: title,
            img: null,
            rarity: 'common',
            level: null,
            publicationTitle: title,
            matchedCount: 0,
            categories: new Set(),
          });
        }
        const entry = aggregated.get(sourceKey);
        entry.matchedCount += 1;
        entry.categories.add(categoryKey);
      }
    }

    return [...aggregated.values()]
      .map((entry) => ({
        ...entry,
        categorySummary: [...entry.categories]
          .map((categoryKey) => game.i18n.localize(`PF2E_LEVELER.SETTINGS.COMPENDIUM_CATEGORIES.${categoryKey.toUpperCase()}`))
          .join(', '),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async _loadSourceDocumentsForCategory(categoryKey, matcher) {
    const items = [];
    for (const key of getCompendiumKeysForCategory(categoryKey)) {
      const pack = game.packs.get(key);
      if (!pack) continue;
      const docs = await loadGuidancePackEntries(pack, key);
      items.push(...docs.filter((doc) => matcher(doc)));
    }
    items.push(...getAllWorldItems().filter((doc) => matcher(doc)));
    return items;
  }

  async _loadAncestryLabels() {
    const cacheKey = '__guidanceAncestryLabels';
    if (this._itemCache[cacheKey]) return this._itemCache[cacheKey];

    const map = new Map();
    for (const key of getCompendiumKeysForCategory('ancestries')) {
      const pack = game.packs.get(key);
      if (!pack) continue;
      const docs = await loadGuidancePackEntries(pack, key);
      for (const doc of docs) {
        if (doc.type !== 'ancestry') continue;
        const slug = String(doc.slug ?? doc.system?.slug ?? '').toLowerCase();
        if (!slug) continue;
        map.set(slug, doc.name);
      }
    }

    for (const doc of getAllWorldItems()) {
      if (doc.type !== 'ancestry') continue;
      const slug = String(doc.slug ?? doc.system?.slug ?? '').toLowerCase();
      if (!slug) continue;
      map.set(slug, doc.name);
    }

    this._itemCache[cacheKey] = map;
    return map;
  }

  _buildHeritageGroups(items) {
    const groups = new Map();
    for (const item of items) {
      const key = item.ancestrySlug ? `ancestry:${item.ancestrySlug}` : 'versatile';
      const label = item.ancestrySlug
        ? (item.ancestryLabel ?? humanizeSlug(item.ancestrySlug) ?? item.name)
        : (game.i18n.localize('PF2E_LEVELER.CREATION.HERITAGE_GROUP_VERSATILE') || 'Versatile');
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label,
          items: [],
          bulkScopeType: 'ancestry',
          bulkScopeValue: item.ancestrySlug ? String(item.ancestrySlug).toLowerCase() : 'versatile',
          bulkActions: this._buildBulkActions(),
          bulkExclusiveActions: this._buildBulkExclusiveActions(),
          bulkFreeArchetypeExclusiveActions: this._getActiveFreeArchetypeExclusiveActions(),
          showFreeArchetypeExclusiveActions: this.activeCategory === 'classArchetypes',
        });
      }
      groups.get(key).items.push(item);
    }
    return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  _buildRarityBulkGroups(items) {
    // Sources are all rarity "common", so a rarity bulk control is noise there; the
    // Bulk-by-Group control covers the sources tab instead.
    if (this.activeCategory === 'sources') return [];
    const raritySet = new Set(items.map((item) => String(item.rarity ?? 'common').toLowerCase()));
    const rarities = ['common', 'uncommon', 'rare', 'unique'].filter((rarity) => raritySet.has(rarity));
    return rarities.map((rarity) => ({
      label: humanizeSlug(rarity),
      scopeType: 'rarity',
      scopeValue: rarity,
      actions: this._buildBulkActions(),
      exclusiveActions: this._buildBulkExclusiveActions(),
      freeArchetypeExclusiveActions: this._getActiveFreeArchetypeExclusiveActions(),
      showFreeArchetypeExclusiveActions: this.activeCategory === 'classArchetypes',
    }));
  }

  _buildPublicationGroupBulkGroups(items) {
    if (this.activeCategory !== 'sources') return [];
    const titles = items.map((item) => String(item.publicationTitle ?? item.name ?? ''));
    return PUBLICATION_GROUPS
      .map((group) => ({ group, count: titles.filter((title) => group.match(title)).length }))
      .filter(({ count }) => count > 0)
      .map(({ group, count }) => ({
        label: game.i18n.localize(group.labelKey),
        count,
        scopeType: 'publicationGroup',
        scopeValue: group.id,
        actions: this._buildBulkActions(),
      }));
  }

  _buildSpecialBulkGroups(items) {
    if (this.activeCategory !== 'classArchetypes' || this.classArchetypesDedicationsOnly) return [];
    const matchingCount = items.filter((item) =>
      isOrphanArchetypeNoPrerequisitesFeat(item) && this._matchesCurrentSearch(item),
    ).length;
    if (matchingCount === 0) return [];
    return [
      {
        label: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.BULK_ARCHETYPE_ONLY_NO_PREREQS'),
        count: matchingCount,
        scopeType: ORPHAN_ARCHETYPE_NO_PREREQS_SCOPE,
        scopeValue: 'true',
        actions: ORPHAN_ARCHETYPE_BULK_STATES.map((status) => ({
          status,
          label: game.i18n.localize(`PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.BULK_${status.replace(/-/g, '_').toUpperCase()}`),
          className: this._getBulkActionClass(status),
        })),
      },
    ];
  }

  _buildBulkActions({ includeAllowed = this._shouldShowAllowedBulkAction() } = {}) {
    const statuses = includeAllowed ? ALLOWLIST_BULK_GUIDANCE_STATES : BULK_GUIDANCE_STATES;
    return statuses.map((status) => ({
      status,
      label: game.i18n.localize(`PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.BULK_${status.replace(/-/g, '_').toUpperCase()}`),
      className: this._getBulkActionClass(status),
    }));
  }

  _buildBulkExclusiveActions() {
    return [
      {
        exclusive: true,
        label: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.BULK_EXCLUSIVE'),
        className: 'tag--exclusive',
      },
      {
        exclusive: false,
        label: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.BULK_CLEAR_EXCLUSIVE'),
        className: '',
      },
    ];
  }

  _buildBulkFreeArchetypeExclusiveActions() {
    return [
      {
        freeArchetypeExclusive: true,
        label: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.BULK_FREE_ARCHETYPE_EXCLUSIVE'),
        className: 'tag--free-archetype-exclusive',
      },
      {
        freeArchetypeExclusive: false,
        label: game.i18n.localize('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.BULK_CLEAR_FREE_ARCHETYPE_EXCLUSIVE'),
        className: '',
      },
    ];
  }

  _getActiveFreeArchetypeExclusiveActions() {
    return this.activeCategory === 'classArchetypes'
      ? this._buildBulkFreeArchetypeExclusiveActions()
      : [];
  }

  _getBulkActionClass(status) {
    if (status === 'allowed') return 'tag--allowed';
    if (status === 'recommended') return 'tag--recommended';
    if (status === 'not-recommended') return 'tag--muted';
    if (status === 'disallowed') return 'tag--disallowed';
    return '';
  }

  _getGuidanceStatusCycle() {
    return this._shouldShowAllowedBulkAction()
      ? ALLOWLIST_GUIDANCE_STATUS_CYCLE
      : DEFAULT_GUIDANCE_STATUS_CYCLE;
  }

  _matchesCurrentSearch(item) {
    const query = String(this.searchText ?? '').trim().toLowerCase();
    if (!query) return true;
    return String(item?.name ?? '').toLowerCase().includes(query);
  }

  _shouldShowAllowedBulkAction() {
    return this._getCategoryDefaultPolicy(this.activeCategory) === CATEGORY_DEFAULT_POLICIES.DISALLOWED;
  }

  _getCategoryDefaultPolicy(categoryKey) {
    const key = getCategoryDefaultGuidanceKey(categoryKey);
    return normalizeGuidanceEntry(this._draft?.[key]).status === CATEGORY_DEFAULT_POLICIES.DISALLOWED
      ? CATEGORY_DEFAULT_POLICIES.DISALLOWED
      : CATEGORY_DEFAULT_POLICIES.ALLOWED;
  }

  _setCategoryDefaultPolicy(policy) {
    const key = getCategoryDefaultGuidanceKey(this.activeCategory);
    if (!key) return;
    if (policy === CATEGORY_DEFAULT_POLICIES.DISALLOWED) this._draft[key] = CATEGORY_DEFAULT_POLICIES.DISALLOWED;
    else delete this._draft[key];
  }

  _setGuidanceStatus(uuid, status) {
    const current = normalizeGuidanceEntry(this._draft?.[uuid]);
    const entry = buildGuidanceEntry(status, current.exclusive, current.freeArchetypeExclusive);
    if (entry) this._draft[uuid] = entry;
    else delete this._draft[uuid];
  }

  _setGuidanceExclusive(uuid, exclusive) {
    const current = normalizeGuidanceEntry(this._draft?.[uuid]);
    const entry = buildGuidanceEntry(current.status, exclusive, exclusive ? false : current.freeArchetypeExclusive);
    if (entry) this._draft[uuid] = entry;
    else delete this._draft[uuid];
  }

  _setGuidanceFreeArchetypeExclusive(uuid, freeArchetypeExclusive) {
    const current = normalizeGuidanceEntry(this._draft?.[uuid]);
    const entry = buildGuidanceEntry(current.status, freeArchetypeExclusive ? false : current.exclusive, freeArchetypeExclusive);
    if (entry) this._draft[uuid] = entry;
    else delete this._draft[uuid];
  }

  _getScrollContainer() {
    return this.element?.querySelector?.('.compendium-manager__panelWrap')
      ?? this.element?.closest?.('.window-content')
      ?? null;
  }

  _showCategoryLoading(activeBtn) {
    const root = this.element;
    if (!root) return;
    root.querySelectorAll('[data-action="select-category"]').forEach((tab) => {
      const isActive = tab === activeBtn;
      tab.classList.toggle('is-active', isActive);
      tab.classList.toggle('is-loading', isActive);
      tab.disabled = true;
    });
    if (activeBtn && !activeBtn.querySelector('.compendium-manager__tab-spinner')) {
      const spinner = document.createElement('i');
      spinner.className = 'fa-solid fa-spinner fa-spin compendium-manager__tab-spinner';
      activeBtn.prepend(spinner);
    }
    const panel = root.querySelector('.compendium-manager__panelWrap');
    if (panel && !panel.querySelector('.compendium-manager__loading')) {
      const overlay = document.createElement('div');
      overlay.className = 'compendium-manager__loading';
      overlay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      panel.appendChild(overlay);
    }
  }

  _rerenderPreservingScroll({ resetScroll = false } = {}) {
    const container = this._getScrollContainer();
    this._pendingScrollTop = resetScroll ? 0 : (container?.scrollTop ?? 0);
    this.render(true);
  }

  _restoreScrollPosition() {
    if (this._pendingScrollTop == null) return;
    const container = this._getScrollContainer();
    if (container) container.scrollTop = this._pendingScrollTop;
    this._pendingScrollTop = null;
  }
}

function humanizeSlug(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function loadGuidancePackEntries(pack, key) {
  if (typeof pack?.getIndex === 'function') {
    try {
      const index = await pack.getIndex({ fields: GUIDANCE_INDEX_FIELDS });
      const entries = Array.isArray(index)
        ? index
        : Array.isArray(index?.contents)
          ? index.contents
          : typeof index?.values === 'function'
            ? [...index.values()]
            : [];
      return entries.map((entry) => ({
        ...entry,
        uuid: entry.uuid ?? buildGuidanceCompendiumUuid(pack, key, entry._id ?? entry.id),
        slug: entry.slug ?? entry.system?.slug ?? null,
      }));
    } catch (error) {
      console.warn(`${MODULE_ID} | Could not load content-guidance index for ${key}`, error);
    }
  }
  return pack?.getDocuments?.().catch(() => []) ?? [];
}

function buildGuidanceCompendiumUuid(pack, key, id) {
  if (!id) return null;
  return `Compendium.${key}.${pack.documentName ?? pack.metadata?.type ?? 'Item'}.${id}`;
}

function isClassArchetypeFeat(doc) {
  const category = String(doc?.system?.category ?? doc?.category ?? '')
    .trim()
    .toLowerCase();
  if (category !== 'class') return false;

  const traits = getTraitValues(doc);
  return ['class-archetype', 'archetype', 'multiclass', 'dedication'].some((trait) => traits.includes(trait));
}

function isDedicationFeat(doc) {
  return getTraitValues(doc).includes('dedication');
}

function isOrphanArchetypeNoPrerequisitesFeat(doc) {
  const category = String(doc?.system?.category ?? doc?.category ?? '')
    .trim()
    .toLowerCase();
  if (category !== 'class') return false;
  if (doc?.hasPrerequisites === true || getPrerequisiteValues(doc).length > 0) return false;

  const traits = new Set(getTraitValues(doc));
  return traits.size === 1 && traits.has('archetype');
}

function getTraitValues(doc) {
  return [
    ...normalizeStringArray(doc?.traits),
    ...normalizeStringArray(doc?.system?.traits?.value),
    ...normalizeStringArray(doc?.system?.traits?.otherTags),
    ...normalizeStringArray(doc?.otherTags),
  ];
}

function getPrerequisiteValues(doc) {
  const values = doc?.prerequisites ?? doc?.system?.prerequisites?.value ?? [];
  if (!Array.isArray(values)) return [];
  return values
    .map((entry) => String(entry?.value ?? entry ?? '').trim())
    .filter(Boolean);
}

function normalizeStringArray(values) {
  return Array.isArray(values) ? values.map((value) => String(value).toLowerCase()) : [];
}

function getAllWorldItems() {
  if (!game.items) return [];
  if (Array.isArray(game.items)) return [...game.items];
  if (Array.isArray(game.items.contents)) return [...game.items.contents];
  if (typeof game.items.filter === 'function') return game.items.filter(() => true);
  return Array.from(game.items);
}

function toGuidanceItem(doc) {
  return {
    uuid: doc.uuid,
    name: doc.name,
    img: doc.img,
    type: doc.type,
    rarity: doc.system?.traits?.rarity ?? doc.rarity ?? 'common',
    level: doc.system?.level?.value ?? doc.level ?? null,
    ancestrySlug: doc.system?.ancestry?.slug ?? doc.ancestrySlug ?? null,
    publicationTitle: doc.system?.publication?.title ?? doc.publicationTitle ?? null,
    slug: doc.slug ?? doc.system?.slug ?? null,
    category: doc.system?.category ?? doc.category ?? null,
    traits: getTraitValues(doc),
    hasPrerequisites: getPrerequisiteValues(doc).length > 0,
  };
}

function dedupeGuidanceItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const uuid = String(item?.uuid ?? '').trim();
    if (!uuid || seen.has(uuid)) return false;
    seen.add(uuid);
    return true;
  });
}

function inferHeritageAncestrySlug(item, ancestryLabels) {
  for (const trait of item?.traits ?? []) {
    const slug = String(trait ?? '').trim().toLowerCase();
    if (ancestryLabels.has(slug)) return slug;
  }
  return null;
}

function isOpenableItemUuid(uuid) {
  const normalized = String(uuid ?? '');
  return normalized.startsWith('Compendium.') || normalized.startsWith('Item.');
}
