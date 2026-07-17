import { addEquipmentPackage, createCreationData, setFeatChoice } from '../../../scripts/creation/creation-model.js';

describe('setFeatChoice', () => {
  test('mirrors granted Runelord sin curriculum choices onto the dual subclass state', () => {
    const data = createCreationData();
    data.dualSubclass = {
      slug: 'runelord',
      name: 'Runelord',
      choiceCurricula: {},
    };
    data.dualCurriculumSpells = {
      cantrips: [{ uuid: 'stale-cantrip', name: 'Old Spell' }],
      rank1: [{ uuid: 'stale-rank1', name: 'Old Rank 1' }],
    };

    setFeatChoice(data, 'dual-grant', 'sin', 'envy', {
      target: 'dualClass',
      curriculum: {
        0: ['Compendium.pf2e.spells-srd.Item.Shield'],
        1: ['Compendium.pf2e.spells-srd.Item.Schadenfreude'],
      },
    });

    expect(data.grantedFeatChoices['dual-grant']).toEqual({ sin: 'envy' });
    expect(data.dualSubclass.choiceCurricula).toEqual({
      sin: {
        0: ['Compendium.pf2e.spells-srd.Item.Shield'],
        1: ['Compendium.pf2e.spells-srd.Item.Schadenfreude'],
      },
    });
    expect(data.dualCurriculumSpells).toEqual({ cantrips: [], rank1: [] });
  });
});

describe('addEquipmentPackage', () => {
  test('adds package contents and merges quantities by UUID', () => {
    const data = createCreationData();
    data.equipment = [{
      uuid: 'Item.dagger',
      name: 'Dagger',
      img: 'dagger.webp',
      quantity: 1,
      price: { sp: 2 },
      pricePer: 1,
    }];

    addEquipmentPackage(data, {
      items: [
        {
          uuid: 'Item.dagger',
          name: 'Dagger',
          img: 'dagger.webp',
          quantity: 2,
          price: { sp: 2 },
          pricePer: 1,
        },
        {
          uuid: 'Item.rapier',
          name: 'Rapier',
          img: 'rapier.webp',
          type: 'weapon',
          quantity: 1,
          level: 0,
          rarity: 'common',
          price: { gp: 2 },
          pricePer: 1,
          bulk: 1,
          bulkPer: 1,
        },
      ],
    });

    expect(data.equipment.find((item) => item.uuid === 'Item.dagger').quantity).toBe(3);
    expect(data.equipment.find((item) => item.uuid === 'Item.rapier')).toEqual(expect.objectContaining({
      name: 'Rapier',
      type: 'weapon',
      quantity: 1,
      price: { gp: 2 },
      bulk: 1,
    }));
  });
});
