import {
  getCharacterWizardCacheStats,
  invalidateCharacterWizardCompendiumCaches,
  loadCompendium,
} from '../../../scripts/ui/character-wizard/loaders.js';

describe('character wizard compendium cache', () => {
  beforeEach(() => {
    invalidateCharacterWizardCompendiumCaches();
  });

  test('shares lightweight compendium indexes between wizard instances', async () => {
    const getIndex = jest.fn(async () => [{
      _id: 'dhampir-id',
      name: 'Dhampir',
      type: 'heritage',
      slug: 'dhampir',
      img: 'dhampir.webp',
      system: {
        traits: { value: ['dhampir'], rarity: 'uncommon' },
        ancestry: { slug: null },
      },
    }]);
    const getDocuments = jest.fn(async () => []);
    const pack = {
      collection: 'test.heritages',
      documentName: 'Item',
      metadata: { label: 'Test Heritages', packageName: 'test' },
      getIndex,
      getDocuments,
    };
    game.packs.get = jest.fn(() => pack);

    const first = await loadCompendium({ _compendiumCache: {} }, 'test.heritages');
    const second = await loadCompendium({ _compendiumCache: {} }, 'test.heritages');

    expect(getIndex).toHaveBeenCalledTimes(1);
    expect(getDocuments).not.toHaveBeenCalled();
    expect(first).toBe(second);
    expect(first[0]).toEqual(expect.objectContaining({
      uuid: 'Compendium.test.heritages.Item.dhampir-id',
      slug: 'dhampir',
      rarity: 'uncommon',
    }));
    expect(getCharacterWizardCacheStats()).toEqual(expect.objectContaining({ cachedPacks: 1, pendingPacks: 0 }));
  });

  test('deduplicates an in-flight index request', async () => {
    let resolveIndex;
    const getIndex = jest.fn(() => new Promise((resolve) => { resolveIndex = resolve; }));
    const pack = {
      collection: 'test.items',
      documentName: 'Item',
      metadata: { label: 'Test Items', packageName: 'test' },
      getIndex,
      getDocuments: jest.fn(async () => []),
    };
    game.packs.get = jest.fn(() => pack);

    const firstRequest = loadCompendium({ _compendiumCache: {} }, 'test.items');
    const secondRequest = loadCompendium({ _compendiumCache: {} }, 'test.items');
    resolveIndex([{ _id: 'item-id', name: 'Item', type: 'equipment', system: {} }]);
    await Promise.all([firstRequest, secondRequest]);

    expect(getIndex).toHaveBeenCalledTimes(1);
  });
});
