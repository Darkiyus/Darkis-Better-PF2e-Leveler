import { MODULE_ID } from './constants.js';
import { getCompendiumKeysForCategory } from './compendiums/catalog.js';
import { getCharacterWizardCacheStats } from './ui/character-wizard/loaders.js';

export async function runSetupDiagnostics() {
  const results = [];
  const configuredPackKeys = collectConfiguredPackKeys();
  const missingPacks = [...configuredPackKeys].filter((key) => !game.packs.get(key));
  for (const key of missingPacks) {
    results.push(createResult('warning', 'missing-pack', 'MISSING_PACK', { key }));
  }

  const [missingGuidance, missingEquipment, duplicateHeritages] = await Promise.all([
    findMissingGuidanceDocuments(),
    findMissingEquipmentDocuments(),
    findDuplicateHeritageSlugs(),
  ]);

  for (const uuid of missingGuidance) {
    results.push(createResult('warning', 'missing-guidance', 'MISSING_GUIDANCE', { uuid }));
  }
  for (const entry of missingEquipment) {
    results.push(createResult('warning', 'missing-equipment', 'MISSING_EQUIPMENT', entry));
  }
  for (const entry of duplicateHeritages) {
    results.push(createResult('info', 'duplicate-heritage', 'DUPLICATE_HERITAGE', entry));
  }

  if (safeGetSetting(MODULE_ID, 'requireReviewApproval') && !safeGetSetting(MODULE_ID, 'enableReviewRequests')) {
    results.push(createResult('warning', 'review-disabled', 'REVIEW_DISABLED'));
  }

  const cache = getCharacterWizardCacheStats();
  results.push(createResult('info', 'cache-status', 'CACHE_STATUS', {
    cached: cache.cachedPacks,
    pending: cache.pendingPacks,
  }));

  if (!results.some((entry) => entry.level === 'warning' || entry.level === 'error')) {
    results.unshift(createResult('success', 'healthy', 'HEALTHY'));
  }
  return results;
}

function collectConfiguredPackKeys() {
  const keys = new Set();
  const custom = safeGetSetting(MODULE_ID, 'customCompendiums');
  for (const entries of Object.values(custom ?? {})) {
    if (Array.isArray(entries)) entries.forEach((key) => keys.add(key));
  }
  const access = safeGetSetting(MODULE_ID, 'playerCompendiumAccess');
  for (const entries of Object.values(access?.selections ?? {})) {
    if (Array.isArray(entries)) entries.forEach((key) => keys.add(key));
  }
  return keys;
}

async function findMissingGuidanceDocuments() {
  const guidance = safeGetSetting(MODULE_ID, 'gmContentGuidance') ?? {};
  const uuids = Object.keys(guidance).filter((key) => key.startsWith('Compendium.') || key.startsWith('Item.'));
  const resolved = await Promise.all(uuids.map(async (uuid) => ({
    uuid,
    document: await fromUuid(uuid).catch(() => null),
  })));
  return resolved.filter((entry) => !entry.document).map((entry) => entry.uuid);
}

async function findMissingEquipmentDocuments() {
  const packages = safeGetSetting(MODULE_ID, 'quickEquipmentPackages') ?? [];
  const references = [];
  for (const equipmentPackage of packages) {
    for (const item of equipmentPackage?.items ?? []) {
      if (item?.uuid) references.push({ packageName: equipmentPackage.name ?? '', itemName: item.name ?? item.uuid, uuid: item.uuid });
    }
  }
  const resolved = await Promise.all(references.map(async (entry) => ({
    ...entry,
    document: await fromUuid(entry.uuid).catch(() => null),
  })));
  return resolved.filter((entry) => !entry.document).map(({ packageName, itemName, uuid }) => ({ packageName, itemName, uuid }));
}

async function findDuplicateHeritageSlugs() {
  const bySlug = new Map();
  for (const key of getCompendiumKeysForCategory('heritages')) {
    const pack = game.packs.get(key);
    if (!pack) continue;
    const entries = await loadHeritageIndex(pack);
    for (const entry of entries) {
      if (entry.type !== 'heritage') continue;
      const slug = String(entry.slug ?? entry.system?.slug ?? '').trim().toLowerCase();
      if (!slug) continue;
      if (!bySlug.has(slug)) bySlug.set(slug, new Set());
      bySlug.get(slug).add(key);
    }
  }
  return [...bySlug.entries()]
    .filter(([, packs]) => packs.size > 1)
    .map(([slug, packs]) => ({ slug, packs: [...packs].join(', ') }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

async function loadHeritageIndex(pack) {
  if (typeof pack.getIndex === 'function') {
    const index = await pack.getIndex({ fields: ['type', 'slug', 'system.slug'] }).catch(() => null);
    if (Array.isArray(index)) return index;
    if (Array.isArray(index?.contents)) return index.contents;
    if (typeof index?.values === 'function') return [...index.values()];
  }
  return pack.getDocuments?.().catch(() => []) ?? [];
}

function createResult(level, code, key, data = {}) {
  return {
    level,
    code,
    icon: {
      success: 'fa-circle-check',
      info: 'fa-circle-info',
      warning: 'fa-triangle-exclamation',
      error: 'fa-circle-xmark',
    }[level] ?? 'fa-circle-info',
    message: game.i18n.format(`PF2E_LEVELER.SETUP.DIAGNOSTICS.${key}`, data),
  };
}

function safeGetSetting(namespace, key) {
  try {
    return game.settings.get(namespace, key);
  } catch {
    return null;
  }
}
