export function localizeOr(key, fallback) {
  const fullKey = `PF2E_LEVELER.${key}`;
  return game.i18n?.has?.(fullKey) ? game.i18n.localize(fullKey) : fallback;
}

export function formatOr(key, data = {}, fallback = '') {
  const fullKey = `PF2E_LEVELER.${key}`;
  if (game.i18n?.has?.(fullKey)) return game.i18n.format(fullKey, data);
  return Object.entries(data).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    fallback,
  );
}
