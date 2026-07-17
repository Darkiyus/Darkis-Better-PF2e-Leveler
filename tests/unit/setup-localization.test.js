import fs from 'fs';
import path from 'path';

const LANGUAGES = ['en', 'de', 'fr', 'cn'];
const CONTENT_GUIDANCE_KEYS = [
  'DISALLOWED_SHARED_HERITAGE_REASON',
  'PLAYER_PREVIEW',
  'PLAYER_PREVIEW_ACTIVE',
  'PLAYER_PREVIEW_BLOCKED',
  'HERITAGE_VIEW',
  'HERITAGE_VIEW_ALL',
];

describe('setup localization', () => {
  const dictionaries = Object.fromEntries(LANGUAGES.map((language) => {
    const file = path.resolve(process.cwd(), 'lang', `${language}.json`);
    return [language, JSON.parse(fs.readFileSync(file, 'utf8')).PF2E_LEVELER];
  }));

  test.each(LANGUAGES)('%s contains every setup-assistant key', (language) => {
    const expected = flattenKeys(dictionaries.en.SETUP);
    const actual = new Set(flattenKeys(dictionaries[language].SETUP));

    expect(expected.filter((key) => !actual.has(key))).toEqual([]);
  });

  test.each(LANGUAGES)('%s contains the versatile-heritage preview keys', (language) => {
    const guidance = dictionaries[language].SETTINGS.CONTENT_GUIDANCE;
    expect(CONTENT_GUIDANCE_KEYS.filter((key) => !guidance?.[key])).toEqual([]);
  });
});

function flattenKeys(value, prefix = '') {
  const keys = [];
  for (const [key, entry] of Object.entries(value ?? {})) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) keys.push(...flattenKeys(entry, pathKey));
    else keys.push(pathKey);
  }
  return keys;
}
