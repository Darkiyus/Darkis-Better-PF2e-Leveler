import { QuickEquipmentPackagesMenu } from '../../../scripts/ui/quick-equipment-packages-menu.js';

describe('QuickEquipmentPackagesMenu', () => {
  beforeEach(() => {
    global._testSettings = {
      'darkis-better-pf2e-leveler': {
        quickEquipmentPackages: [],
      },
    };
    game.settings.set.mockClear();
    ui.notifications.info.mockClear();
    ui.notifications.warn.mockClear();
  });

  afterEach(() => {
    delete global._testSettings;
    jest.restoreAllMocks();
  });

  test('creates and selects a complete draft package', () => {
    const menu = new QuickEquipmentPackagesMenu();
    menu.render = jest.fn();

    menu._createPackage();

    expect(menu._draftPackages).toHaveLength(1);
    expect(menu._getActivePackage()).toEqual(expect.objectContaining({
      type: 'kit',
      name: 'PF2E_LEVELER.QUICK_EQUIPMENT.NEW_PACKAGE',
      img: 'icons/svg/item-bag.svg',
      items: [],
    }));
    expect(menu.render).toHaveBeenCalledWith(true);
  });

  test('toggles class slugs and recalculates price after content changes', () => {
    const menu = new QuickEquipmentPackagesMenu();
    menu._draftPackages = [{
      id: 'rogue-kit',
      name: 'Rogue Kit',
      img: 'kit.webp',
      classSlugs: [],
      items: [{
        uuid: 'Item.rapier',
        name: 'Rapier',
        quantity: 1,
        price: { gp: 2 },
        pricePer: 1,
        bulk: 1,
        bulkPer: 1,
      }],
      system: {
        description: { value: '' },
        level: { value: 0 },
        traits: { rarity: 'common', value: [] },
      },
    }];
    menu.activePackageId = 'rogue-kit';
    menu.render = jest.fn();

    menu._toggleActivePackageClass('rogue');
    menu._toggleActivePackageClass('ranger');

    expect(menu._getActivePackage()).toEqual(expect.objectContaining({
      classSlugs: ['rogue', 'ranger'],
      priceCp: 200,
      bulkUnits: 10,
    }));
  });

  test('saves normalized packages to the world setting', async () => {
    const menu = new QuickEquipmentPackagesMenu();
    menu.close = jest.fn();
    menu.render = jest.fn();
    menu._draftPackages = [{
      id: 'starter-kit',
      name: 'Starter Kit',
      items: [],
    }];
    menu.activePackageId = 'starter-kit';

    await menu._save();

    expect(game.settings.set).toHaveBeenCalledWith(
      'darkis-better-pf2e-leveler',
      'quickEquipmentPackages',
      [expect.objectContaining({ id: 'starter-kit', name: 'Starter Kit', type: 'kit' })],
    );
    expect(ui.notifications.info).toHaveBeenCalledWith('PF2E_LEVELER.QUICK_EQUIPMENT.SAVED');
    expect(menu.close).toHaveBeenCalled();
  });

  test('refuses to save an unnamed package', async () => {
    const menu = new QuickEquipmentPackagesMenu();
    menu.render = jest.fn();
    menu._draftPackages = [{ id: 'unnamed', name: '   ', items: [] }];

    await menu._save();

    expect(game.settings.set).not.toHaveBeenCalled();
    expect(ui.notifications.warn).toHaveBeenCalledWith('PF2E_LEVELER.QUICK_EQUIPMENT.NAME_REQUIRED');
    expect(menu.activePackageId).toBe('unnamed');
  });
});
