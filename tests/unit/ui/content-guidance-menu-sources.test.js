import { ContentGuidanceMenu } from '../../../scripts/ui/content-guidance-menu.js';

jest.mock('../../../scripts/access/content-guidance.js', () => ({
  buildGuidanceEntry: jest.fn((status, exclusive = false, freeArchetypeExclusive = false) => {
    const normalizedStatus = status && status !== 'default' ? status : null;
    const normalizedExclusive = exclusive === true && normalizedStatus !== 'disallowed';
    const normalizedFreeArchetypeExclusive = freeArchetypeExclusive === true && normalizedStatus !== 'disallowed';
    if (!normalizedStatus && !normalizedExclusive && !normalizedFreeArchetypeExclusive) return null;
    if (!normalizedExclusive && !normalizedFreeArchetypeExclusive) return normalizedStatus;
    return {
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(normalizedExclusive ? { exclusive: true } : {}),
      ...(normalizedFreeArchetypeExclusive ? { freeArchetypeExclusive: true } : {}),
    };
  }),
  CATEGORY_DEFAULT_POLICIES: { ALLOWED: 'allowed', DISALLOWED: 'disallowed' },
  getContentGuidance: jest.fn(() => ({})),
  getGuidanceKeyForItem: jest.fn((item) => item?.uuid ?? null),
  getPlayerDisallowedContentMode: jest.fn(() => 'unselectable'),
  PLAYER_DISALLOWED_CONTENT_MODES: { HIDDEN: 'hidden', UNSELECTABLE: 'unselectable' },
  invalidateGuidanceCache: jest.fn(),
  getCategoryDefaultGuidanceKey: jest.fn((categoryKey) => `category-default:${categoryKey}`),
  getSourceGuidanceKey: jest.fn((title) => `source-title:${String(title ?? '').trim().toLowerCase().replace(/\s+/g, ' ')}`),
  normalizeGuidanceEntry: jest.fn((entry) => {
    if (typeof entry === 'string') return { status: entry === 'default' ? null : entry, exclusive: false, freeArchetypeExclusive: false };
    if (!entry || typeof entry !== 'object') return { status: null, exclusive: false, freeArchetypeExclusive: false };
    const status = entry.status && entry.status !== 'default' ? entry.status : null;
    return {
      status,
      exclusive: entry.exclusive === true && status !== 'disallowed',
      freeArchetypeExclusive: entry.freeArchetypeExclusive === true && status !== 'disallowed',
    };
  }),
}));

describe('ContentGuidanceMenu sources tab', () => {
  test('builds unique source rows with matched item counts', async () => {
    const menu = new ContentGuidanceMenu();
    menu.activeCategory = 'sources';
    menu._draft = {};
    menu._itemCache.sources = [
      { uuid: 'source-title:pathfinder player core', name: 'Pathfinder Player Core', matchedCount: 3, categorySummary: 'Ancestries, Feats' },
      { uuid: 'source-title:lost omens divine mysteries', name: 'Lost Omens Divine Mysteries', matchedCount: 1, categorySummary: 'Spells' },
    ];

    const context = await menu._prepareContext();

    expect(context.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        uuid: 'source-title:pathfinder player core',
        name: 'Pathfinder Player Core',
        matchedCount: 3,
      }),
      expect.objectContaining({
        uuid: 'source-title:lost omens divine mysteries',
        matchedCount: 1,
      }),
    ]));
  });

  test('filters sources tab in the rendered DOM by source title', () => {
    document.body.innerHTML = `
      <div class="compendium-manager__panelWrap" style="overflow:auto">
        <input type="text" data-action="search-guidance" value="">
        <div class="guidance-item"><span class="guidance-item__name">Pathfinder Player Core</span></div>
        <div class="guidance-item"><span class="guidance-item__name">Lost Omens Divine Mysteries</span></div>
      </div>
    `;

    const menu = new ContentGuidanceMenu();
    menu.activeCategory = 'sources';
    menu.searchText = 'player core';
    menu._draft = {};
    menu.element = document.body;
    menu.render = jest.fn();

    menu._onRender();

    const items = [...document.querySelectorAll('.guidance-item')];
    expect(items[0].style.display).toBe('');
    expect(items[1].style.display).toBe('none');
  });

  test('existing item tabs expose inherited source guidance status', async () => {
    const menu = new ContentGuidanceMenu();
    menu.activeCategory = 'backgrounds';
    menu._draft = {
      'source-title:pathfinder player core': 'disallowed',
    };
    menu._itemCache.backgrounds = [
      {
        uuid: 'bg-common',
        name: 'Scholar',
        rarity: 'common',
        level: 1,
        publicationTitle: 'Pathfinder Player Core',
      },
    ];

    const context = await menu._prepareContext();

    expect(context.items).toEqual([
      expect.objectContaining({
        uuid: 'bg-common',
        isDisallowed: true,
        isRecommended: false,
        isNotRecommended: false,
        guidanceInherited: true,
      }),
    ]);
  });
});
