import { formatOr, localizeOr } from '../../scripts/utils/i18n-fallback.js';

describe('i18n fallback helpers', () => {
  let originalI18n;

  beforeEach(() => {
    originalI18n = game.i18n;
  });

  afterEach(() => {
    game.i18n = originalI18n;
  });

  test('uses the active Foundry translation when the key exists', () => {
    game.i18n = {
      has: jest.fn(() => true),
      localize: jest.fn(() => 'Ausrüstung'),
      format: jest.fn((_key, data) => `Stufe ${data.level}`),
    };

    expect(localizeOr('ITEM_PICKER.EQUIPMENT', 'Equipment')).toBe('Ausrüstung');
    expect(formatOr('UI.LEVEL', { level: 3 }, 'Level {level}')).toBe('Stufe 3');
  });

  test('interpolates the English fallback when no translation key exists', () => {
    game.i18n = {
      has: jest.fn(() => false),
      localize: jest.fn(),
      format: jest.fn(),
    };

    expect(localizeOr('ITEM_PICKER.EQUIPMENT', 'Equipment')).toBe('Equipment');
    expect(formatOr('UI.CONFIRM_APPLY_RANGE', { startLevel: 2, endLevel: 4 }, 'Apply {startLevel} to {endLevel}'))
      .toBe('Apply 2 to 4');
  });
});
