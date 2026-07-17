import fs from 'node:fs';
import path from 'node:path';

function readLanguage(language) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'lang', `${language}.json`), 'utf8'));
}

function flattenLeaves(value, prefix = '', result = new Map()) {
  for (const [key, entry] of Object.entries(value ?? {})) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      flattenLeaves(entry, pathKey, result);
    } else {
      result.set(pathKey, entry);
    }
  }
  return result;
}

function placeholders(value) {
  return [...String(value ?? '').matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]).sort();
}

describe('German localization', () => {
  test('contains every English translation key and preserves format placeholders', () => {
    const english = flattenLeaves(readLanguage('en'));
    const german = flattenLeaves(readLanguage('de'));

    expect([...german.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, englishValue] of english) {
      expect(placeholders(german.get(key))).toEqual(placeholders(englishValue));
    }
  });

  test('uses the established German Pathfinder 2e core terms', () => {
    const german = readLanguage('de').PF2E_LEVELER;

    expect(german.CREATION.STEPS.HERITAGE).toBe('Herkunft');
    expect(german.CREATION.STEPS.ANCESTRY).toBe('Abstammung');
    expect(german.SECTIONS.ABILITY_BOOSTS).toBe('Attributsverbesserungen');
    expect(german.SECTIONS.SKILL_INCREASE).toBe('Fertigkeitsverbesserung');
    expect(german.QUICK_EQUIPMENT.BULK).toBe('Last');
    expect(german.SPELLS.RANK).toBe('Grad');
    expect([german.SKILLS.UNTRAINED, german.SKILLS.TRAINED, german.SKILLS.EXPERT, german.SKILLS.MASTER, german.SKILLS.LEGENDARY])
      .toEqual(['Ungeübt', 'Geübt', 'Experte', 'Meister', 'Legende']);
  });
});

describe('Ability boost guidance localization', () => {
  const keys = ['BOOSTS_GUIDE_TITLE', 'BOOSTS_GUIDE_BODY', 'BOOSTS_FREE_REMAINING', 'BOOSTS_ALTERNATE_HINT'];

  test.each(['en', 'de', 'fr', 'cn'])('%s contains every guidance string with matching placeholders', (language) => {
    const english = readLanguage('en').PF2E_LEVELER.CREATION;
    const translation = readLanguage(language).PF2E_LEVELER.CREATION;

    for (const key of keys) {
      expect(translation[key]).toEqual(expect.any(String));
      expect(translation[key].length).toBeGreaterThan(0);
      expect(placeholders(translation[key])).toEqual(placeholders(english[key]));
    }
  });
});

describe('Fork feature localization', () => {
  test.each(['de', 'fr', 'cn'])('%s translates quick-equipment and item-picker additions', (language) => {
    const english = readLanguage('en').PF2E_LEVELER;
    const translation = readLanguage(language).PF2E_LEVELER;

    for (const section of ['QUICK_EQUIPMENT', 'ITEM_PICKER']) {
      const englishEntries = flattenLeaves(english[section]);
      const translatedEntries = flattenLeaves(translation[section]);

      for (const [key, value] of englishEntries) {
        expect(translatedEntries.get(key)).toEqual(expect.any(String));
        expect(placeholders(translatedEntries.get(key))).toEqual(placeholders(value));
      }
    }
  });
});
