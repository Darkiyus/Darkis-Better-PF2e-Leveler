import {
  bulkValueToUnits,
  copperToCoins,
  createQuickEquipmentPackage,
  equipmentEntriesTotalBulkUnits,
  equipmentEntriesTotalCopper,
  formatBulkUnits,
  mergePackageItems,
  normalizeQuickEquipmentPackage,
  packageItemFromDocument,
} from '../../../scripts/equipment/quick-equipment-packages.js';

describe('quick equipment packages', () => {
  test('creates an item-shaped package with derived price and bulk', () => {
    const quickPackage = normalizeQuickEquipmentPackage({
      id: 'rogue-kit',
      name: 'Quick Equipment Package, Rogue',
      img: 'rogue-kit.webp',
      classSlug: 'Rogue',
      description: 'Everything a new rogue needs.',
      items: [
        { uuid: 'Item.leather', name: 'Leather Armor', quantity: 1, price: { gp: 2 }, bulk: 1 },
        { uuid: 'Item.rapier', name: 'Rapier', quantity: 1, price: { gp: 2 }, bulk: 1 },
        { uuid: 'Item.pack', name: "Adventurer's Pack", quantity: 1, price: { gp: 2, sp: 2 }, bulk: 2.1 },
      ],
    });

    expect(quickPackage).toMatchObject({
      id: 'rogue-kit',
      type: 'kit',
      name: 'Quick Equipment Package, Rogue',
      img: 'rogue-kit.webp',
      classSlugs: ['rogue'],
      priceCp: 620,
      priceLabel: '6 gp, 2 sp',
      bulkUnits: 41,
      bulkLabel: '4.1',
      system: {
        description: { value: 'Everything a new rogue needs.' },
        price: { value: { gp: 6, sp: 2, cp: 0 }, per: 1 },
        bulk: { value: 4.1, per: 1 },
      },
    });
  });

  test('uses price and bulk batch sizes when calculating quantities', () => {
    const entries = [
      {
        uuid: 'Item.arrows',
        name: 'Arrows',
        quantity: 20,
        price: { sp: 1 },
        pricePer: 10,
        bulk: 0.1,
        bulkPer: 10,
      },
    ];

    expect(equipmentEntriesTotalCopper(entries)).toBe(20);
    expect(equipmentEntriesTotalBulkUnits(entries)).toBe(2);
  });

  test('converts PF2e light and decimal bulk values', () => {
    expect(bulkValueToUnits('L')).toBe(1);
    expect(bulkValueToUnits('4,1')).toBe(41);
    expect(formatBulkUnits(41)).toBe('4.1');
  });

  test('creates a complete package entry from a PF2e document', () => {
    const entry = packageItemFromDocument({
      uuid: 'Compendium.pf2e.equipment-srd.Item.rapier',
      name: 'Rapier',
      img: 'rapier.webp',
      type: 'weapon',
      system: {
        description: { value: '<p>A slender sword.</p>' },
        level: { value: 0 },
        traits: { rarity: 'common', value: ['deadly-d8'] },
        price: { value: { gp: 2 }, per: 1 },
        bulk: { value: 1, per: 1 },
      },
    }, 2);

    expect(entry).toEqual(expect.objectContaining({
      uuid: 'Compendium.pf2e.equipment-srd.Item.rapier',
      name: 'Rapier',
      img: 'rapier.webp',
      type: 'weapon',
      quantity: 2,
      description: '<p>A slender sword.</p>',
      traits: ['deadly-d8'],
      price: { gp: 2, sp: 0, cp: 0 },
      bulk: 1,
    }));
  });

  test('merges duplicate item UUIDs and preserves package source data', () => {
    const merged = mergePackageItems(
      [{ uuid: 'Item.dagger', name: 'Dagger', quantity: 1, price: { sp: 2 }, bulk: 0.1 }],
      [{ uuid: 'Item.dagger', name: 'Dagger', quantity: 2, price: { sp: 2 }, bulk: 0.1 }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
    expect(merged[0].price).toEqual({ gp: 0, sp: 2, cp: 0 });
  });

  test('creates safe defaults and normalizes copper values', () => {
    const quickPackage = createQuickEquipmentPackage({ name: 'Starter Set' });
    expect(quickPackage.type).toBe('kit');
    expect(quickPackage.system.price.value).toEqual({ gp: 0, sp: 0, cp: 0 });
    expect(copperToCoins(123)).toEqual({ gp: 1, sp: 2, cp: 3 });
  });
});
