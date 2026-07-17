import {
  annotateGuidance,
  annotateGuidanceBySlug,
  filterDisallowedForCurrentUser,
  getCategoryDefaultGuidanceKey,
  getGuidanceSelectionTooltip,
  getGuidanceForSourceTitle,
  getPlayerDisallowedContentMode,
  PLAYER_DISALLOWED_CONTENT_MODES,
  getSourceGuidanceKey,
  isGuidanceSelectionBlocked,
  invalidateGuidanceCache,
  normalizeSourceTitle,
} from '../../../scripts/access/content-guidance.js';

jest.mock('../../../scripts/access/player-content.js', () => ({
  shouldRestrictContentForUser: jest.fn(() => true),
}));

const { shouldRestrictContentForUser } = jest.requireMock('../../../scripts/access/player-content.js');

describe('content guidance source rules', () => {
  beforeEach(() => {
    global._testSettings = {
      'pf2e-leveler': {
        gmContentGuidance: {},
        playerDisallowedContentMode: PLAYER_DISALLOWED_CONTENT_MODES.UNSELECTABLE,
      },
    };
    invalidateGuidanceCache();
    shouldRestrictContentForUser.mockReturnValue(true);
  });

  test('normalizes source titles into stable keys', () => {
    expect(normalizeSourceTitle('  Pathfinder   Player Core  ')).toBe('pathfinder player core');
    expect(getSourceGuidanceKey('  Pathfinder   Player Core  ')).toBe('source-title:pathfinder player core');
  });

  test('reads source guidance by publication title', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'source-title:pathfinder player core': 'recommended',
    };

    expect(getGuidanceForSourceTitle('Pathfinder Player Core')).toBe('recommended');
  });

  test('reads object-backed source guidance by publication title', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'source-title:pathfinder player core': { status: 'allowed', exclusive: true },
    };

    expect(getGuidanceForSourceTitle('Pathfinder Player Core')).toBe('allowed');
  });

  test('annotateGuidance applies source status when item has no direct override', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'source-title:pathfinder player core': 'not-recommended',
    };

    const [item] = annotateGuidance([{
      uuid: 'Compendium.test.feats.Item.abc',
      name: 'Feat',
      publicationTitle: 'Pathfinder Player Core',
    }]);

    expect(item.isRecommended).toBe(false);
    expect(item.isNotRecommended).toBe(true);
    expect(item.isDisallowed).toBe(false);
    expect(item.guidanceInherited).toBe(true);
  });

  test('annotateGuidance keeps direct item guidance over source guidance', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'source-title:pathfinder player core': 'disallowed',
      'Compendium.test.feats.Item.abc': 'recommended',
    };

    const [item] = annotateGuidance([{
      uuid: 'Compendium.test.feats.Item.abc',
      name: 'Feat',
      publicationTitle: 'Pathfinder Player Core',
    }]);

    expect(item.isRecommended).toBe(true);
    expect(item.isNotRecommended).toBe(false);
    expect(item.isDisallowed).toBe(false);
    expect(item.guidanceInherited).toBe(false);
  });

  test('category default can disallow unmarked items while explicit allow overrides it', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      [getCategoryDefaultGuidanceKey('backgrounds')]: 'disallowed',
      'Compendium.test.backgrounds.Item.allowed': 'allowed',
    };

    const [blocked, allowed] = annotateGuidance([
      {
        uuid: 'Compendium.test.backgrounds.Item.blocked',
        type: 'background',
        name: 'Blocked Background',
      },
      {
        uuid: 'Compendium.test.backgrounds.Item.allowed',
        type: 'background',
        name: 'Allowed Background',
      },
    ]);

    expect(blocked.isDisallowed).toBe(true);
    expect(blocked.guidanceInherited).toBe(true);
    expect(blocked.guidanceSelectionBlocked).toBe(true);
    expect(allowed.isAllowed).toBe(true);
    expect(allowed.isDisallowed).toBe(false);
    expect(allowed.guidanceInherited).toBe(false);
  });

  test('heritages use their own guidance category for recommendations and bans', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      [getCategoryDefaultGuidanceKey('heritages')]: 'disallowed',
      'Compendium.test.heritages.Item.ancient-elf': 'recommended',
    };

    const [recommended, blocked] = annotateGuidance([
      {
        uuid: 'Compendium.test.heritages.Item.ancient-elf',
        type: 'heritage',
        name: 'Ancient Elf',
      },
      {
        uuid: 'Compendium.test.heritages.Item.woodland-elf',
        type: 'heritage',
        name: 'Woodland Elf',
      },
    ]);

    expect(recommended).toEqual(expect.objectContaining({
      isRecommended: true,
      isDisallowed: false,
      guidanceSelectionBlocked: false,
    }));
    expect(blocked).toEqual(expect.objectContaining({
      isRecommended: false,
      isDisallowed: true,
      guidanceInherited: true,
      guidanceSelectionBlocked: true,
    }));
  });

  test('heritage slug guidance applies across compendium copies', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'heritage-slug:dhampir': 'disallowed',
      'Compendium.pf2e.heritages.Item.dhampir': 'recommended',
    };

    const [official, translated] = annotateGuidance([
      {
        uuid: 'Compendium.pf2e.heritages.Item.dhampir',
        type: 'heritage',
        slug: 'dhampir',
        name: 'Dhampir',
      },
      {
        uuid: 'Compendium.translation.heritages.Item.dhampir-de',
        type: 'heritage',
        slug: 'dhampir',
        name: 'Dhampir',
      },
    ]);

    expect(official.isDisallowed).toBe(true);
    expect(translated.isDisallowed).toBe(true);
    expect(official.guidanceIdentityInherited).toBe(true);
    expect(translated.guidanceSelectionBlocked).toBe(true);
  });

  test('exclusive direct guidance filters non-exclusive siblings for players', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'Compendium.test.feats.Item.medic-dedication': { status: 'recommended', exclusive: true },
    };

    const [exclusive, filtered] = annotateGuidance([
      {
        uuid: 'Compendium.test.feats.Item.medic-dedication',
        type: 'feat',
        name: 'Medic Dedication',
        system: { category: 'class', traits: { value: ['archetype', 'dedication'] } },
      },
      {
        uuid: 'Compendium.test.feats.Item.wizard-dedication',
        type: 'feat',
        name: 'Wizard Dedication',
        system: { category: 'class', traits: { value: ['archetype', 'dedication'] } },
      },
    ]);

    expect(exclusive.isExclusive).toBe(true);
    expect(exclusive.isRecommended).toBe(true);
    expect(exclusive.isDisallowed).toBe(false);
    expect(filtered.isExclusive).toBe(false);
    expect(filtered.isDisallowed).toBe(true);
    expect(filtered.guidanceExclusiveFiltered).toBe(true);
    expect(filtered.guidanceSelectionBlocked).toBe(true);
  });

  test('exclusive archetype dedication keeps same archetype follow-up feats selectable', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'Compendium.test.feats.Item.medic-dedication': { status: 'recommended', exclusive: true },
    };

    const [dedication, followup, unrelated] = annotateGuidance([
      {
        uuid: 'Compendium.test.feats.Item.medic-dedication',
        type: 'feat',
        name: 'Medic Dedication',
        system: { category: 'class', traits: { value: ['archetype', 'dedication', 'medic'] } },
      },
      {
        uuid: 'Compendium.test.feats.Item.doctors-visitation',
        type: 'feat',
        name: "Doctor's Visitation",
        system: { category: 'class', traits: { value: ['archetype', 'medic'] } },
      },
      {
        uuid: 'Compendium.test.feats.Item.wizard-dedication',
        type: 'feat',
        name: 'Wizard Dedication',
        system: { category: 'class', traits: { value: ['archetype', 'dedication', 'multiclass', 'wizard'] } },
      },
    ]);

    expect(dedication.isExclusive).toBe(true);
    expect(dedication.isRecommended).toBe(true);
    expect(followup.isExclusive).toBe(true);
    expect(followup.isDisallowed).toBe(false);
    expect(followup.guidanceSelectionBlocked).toBe(false);
    expect(unrelated.isExclusive).toBe(false);
    expect(unrelated.isDisallowed).toBe(true);
    expect(unrelated.guidanceExclusiveFiltered).toBe(true);
  });

  test('free archetype exclusive guidance only gates free archetype contexts', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'Compendium.test.feats.Item.acrobat-dedication': { status: 'recommended', exclusive: true, freeArchetypeExclusive: true },
    };

    const buildItems = () => [
      {
        uuid: 'Compendium.test.feats.Item.acrobat-dedication',
        type: 'feat',
        name: 'Acrobat Dedication',
        slug: 'acrobat-dedication',
        system: { category: 'class', traits: { value: ['archetype', 'dedication', 'acrobat'] } },
      },
      {
        uuid: 'Compendium.test.feats.Item.contortionist',
        type: 'feat',
        name: 'Contortionist',
        slug: 'contortionist',
        system: { category: 'class', traits: { value: ['archetype', 'acrobat'] } },
      },
      {
        uuid: 'Compendium.test.feats.Item.wizard-dedication',
        type: 'feat',
        name: 'Wizard Dedication',
        slug: 'wizard-dedication',
        system: { category: 'class', traits: { value: ['archetype', 'dedication', 'multiclass', 'wizard'] } },
      },
    ];

    const [classDedication, classFollowup, classWizard] = annotateGuidance(buildItems());
    expect(classDedication.isExclusive).toBe(false);
    expect(classDedication.isFreeArchetypeExclusive).toBe(false);
    expect(classFollowup.isExclusive).toBe(false);
    expect(classFollowup.isFreeArchetypeExclusive).toBe(false);
    expect(classWizard.isDisallowed).toBe(false);
    expect(classWizard.guidanceExclusiveFiltered).toBe(false);
    expect(classWizard.guidanceFreeArchetypeExclusiveFiltered).toBe(false);
    expect(classWizard.guidanceSelectionBlocked).toBe(false);

    const [freeDedication, freeFollowup, freeWizard] = annotateGuidance(buildItems(), {
      freeArchetype: true,
    });
    expect(freeDedication.isFreeArchetypeExclusive).toBe(true);
    expect(freeDedication.isRecommended).toBe(true);
    expect(freeFollowup.isFreeArchetypeExclusive).toBe(true);
    expect(freeFollowup.isDisallowed).toBe(false);
    expect(freeWizard.isDisallowed).toBe(true);
    expect(freeWizard.guidanceFreeArchetypeExclusiveFiltered).toBe(true);
    expect(freeWizard.guidanceSelectionBlocked).toBe(true);
  });

  test('exclusive source guidance filters non-exclusive items in the same list', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'source-title:pathfinder player core': { status: 'allowed', exclusive: true },
    };

    const [exclusive, filtered] = annotateGuidance([
      {
        uuid: 'Compendium.test.spells.Item.core',
        name: 'Core Spell',
        publicationTitle: 'Pathfinder Player Core',
      },
      {
        uuid: 'Compendium.test.spells.Item.other',
        name: 'Other Spell',
        publicationTitle: 'Other Book',
      },
    ]);

    expect(exclusive.isAllowed).toBe(true);
    expect(exclusive.isExclusive).toBe(true);
    expect(exclusive.isDisallowed).toBe(false);
    expect(filtered.isDisallowed).toBe(true);
    expect(filtered.guidanceExclusiveFiltered).toBe(true);
  });

  test('sources category default disallows items from unmarked sources', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      [getCategoryDefaultGuidanceKey('sources')]: 'disallowed',
      'source-title:pathfinder player core': 'allowed',
    };

    const [allowed, blocked] = annotateGuidance([
      {
        uuid: 'Compendium.test.feats.Item.core',
        name: 'Core Feat',
        publicationTitle: 'Pathfinder Player Core',
      },
      {
        uuid: 'Compendium.test.feats.Item.other',
        name: 'Other Feat',
        publicationTitle: 'Other Book',
      },
    ]);

    expect(allowed.isAllowed).toBe(true);
    expect(allowed.isDisallowed).toBe(false);
    expect(blocked.isDisallowed).toBe(true);
    expect(blocked.guidanceInherited).toBe(true);
  });

  test('slug guidance respects category defaults and exclusive gates', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      [getCategoryDefaultGuidanceKey('skills')]: 'disallowed',
      'skill:medicine': { status: 'allowed', exclusive: true },
    };

    const [medicine, arcana] = annotateGuidanceBySlug([
      { slug: 'medicine', label: 'Medicine' },
      { slug: 'arcana', label: 'Arcana' },
    ], 'skill');

    expect(medicine.isAllowed).toBe(true);
    expect(medicine.isExclusive).toBe(true);
    expect(medicine.isDisallowed).toBe(false);
    expect(arcana.isDisallowed).toBe(true);
    expect(arcana.guidanceExclusiveFiltered).toBe(true);
  });

  test('disallowed guidance blocks players but not GMs', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'source-title:pathfinder player core': 'disallowed',
    };

    shouldRestrictContentForUser.mockReturnValue(true);
    const [playerItem] = annotateGuidance([{
      uuid: 'Compendium.test.spells.Item.abc',
      publicationTitle: 'Pathfinder Player Core',
    }]);

    expect(isGuidanceSelectionBlocked(playerItem)).toBe(true);
    expect(playerItem.guidanceSelectionBlocked).toBe(true);
    expect(getGuidanceSelectionTooltip(playerItem)).toBe('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.BADGE_DISALLOWED');

    shouldRestrictContentForUser.mockReturnValue(false);
    const [gmItem] = annotateGuidance([{
      uuid: 'Compendium.test.spells.Item.xyz',
      publicationTitle: 'Pathfinder Player Core',
    }]);

    expect(isGuidanceSelectionBlocked(gmItem)).toBe(false);
    expect(gmItem.guidanceSelectionBlocked).toBe(false);
    expect(getGuidanceSelectionTooltip(gmItem)).toBe('PF2E_LEVELER.SETTINGS.CONTENT_GUIDANCE.GM_OVERRIDE_ALLOWED');
  });

  test('defaults player disallowed mode to unselectable when setting is unset', () => {
    delete global._testSettings['pf2e-leveler'].playerDisallowedContentMode;

    expect(getPlayerDisallowedContentMode()).toBe(PLAYER_DISALLOWED_CONTENT_MODES.UNSELECTABLE);
  });

  test('filters disallowed entries only when player mode is hidden', () => {
    global._testSettings['pf2e-leveler'].gmContentGuidance = {
      'source-title:pathfinder player core': 'disallowed',
    };
    invalidateGuidanceCache();

    const annotated = annotateGuidance([
      { uuid: 'allowed', publicationTitle: 'Other Book' },
      { uuid: 'blocked', publicationTitle: 'Pathfinder Player Core' },
    ]);

    global._testSettings['pf2e-leveler'].playerDisallowedContentMode = PLAYER_DISALLOWED_CONTENT_MODES.UNSELECTABLE;
    expect(filterDisallowedForCurrentUser(annotated).map((item) => item.uuid)).toEqual(['allowed', 'blocked']);

    global._testSettings['pf2e-leveler'].playerDisallowedContentMode = PLAYER_DISALLOWED_CONTENT_MODES.HIDDEN;
    expect(filterDisallowedForCurrentUser(annotated).map((item) => item.uuid)).toEqual(['allowed']);
  });
});
