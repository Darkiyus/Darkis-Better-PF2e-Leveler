import { CharacterWizard } from '../../../scripts/ui/character-wizard/index.js';

const ROGUE_PACKAGE = {
  id: 'rogue-kit',
  name: 'Rogue Kit',
  img: 'rogue.webp',
  classSlugs: ['rogue'],
  items: [{
    uuid: 'Item.rapier',
    name: 'Rapier',
    img: 'rapier.webp',
    type: 'weapon',
    quantity: 1,
    price: { gp: 2 },
    pricePer: 1,
    bulk: 1,
    bulkPer: 1,
  }],
};

describe('CharacterWizard quick equipment packages', () => {
  const originalIsGM = game.user.isGM;

  beforeEach(() => {
    global._testSettings = {
      'pf2e-leveler': {
        quickEquipmentPackages: [
          ROGUE_PACKAGE,
          { ...ROGUE_PACKAGE, id: 'fighter-kit', name: 'Fighter Kit', classSlugs: ['fighter'] },
          { ...ROGUE_PACKAGE, id: 'general-kit', name: 'General Kit', classSlugs: [] },
        ],
        startingWealthMode: 'DISABLED',
      },
    };
    game.user.isGM = true;
    ui.notifications.info.mockClear();
    ui.notifications.warn.mockClear();
  });

  afterEach(() => {
    game.user.isGM = originalIsGM;
    delete global._testSettings;
  });

  test('shows class-matching and general packages only', () => {
    const wizard = new CharacterWizard(createMockActor());
    wizard.data.class = { slug: 'rogue', name: 'Rogue' };

    const context = wizard._buildEquipmentContext();

    expect(context.quickEquipmentPackages.map((entry) => entry.id)).toEqual(['rogue-kit', 'general-kit']);
    expect(context.canManageQuickEquipmentPackages).toBe(true);
  });

  test('adds every contained item and saves the creation data', () => {
    const wizard = new CharacterWizard(createMockActor());
    wizard._saveAndRender = jest.fn();

    wizard._addQuickEquipmentPackage('rogue-kit');

    expect(wizard.data.equipment).toEqual([
      expect.objectContaining({ uuid: 'Item.rapier', name: 'Rapier', quantity: 1 }),
    ]);
    expect(wizard._saveAndRender).toHaveBeenCalled();
    expect(ui.notifications.info).toHaveBeenCalledWith('PF2E_LEVELER.QUICK_EQUIPMENT.ADDED');
  });

  test('blocks a player package that exceeds the remaining custom budget', () => {
    global._testSettings['pf2e-leveler'].startingWealthMode = 'CUSTOM';
    global._testSettings['pf2e-leveler'].startingEquipmentGoldLimit = 1;
    game.user.isGM = false;
    const wizard = new CharacterWizard(createMockActor());
    wizard._saveAndRender = jest.fn();

    wizard._addQuickEquipmentPackage('rogue-kit');

    expect(wizard.data.equipment).toEqual([]);
    expect(wizard._saveAndRender).not.toHaveBeenCalled();
    expect(ui.notifications.warn).toHaveBeenCalledWith('PF2E_LEVELER.QUICK_EQUIPMENT.BUDGET_EXCEEDED');
  });
});
