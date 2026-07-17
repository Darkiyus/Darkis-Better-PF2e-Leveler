import { MODULE_ID } from '../constants.js';

export const QUICK_EQUIPMENT_PACKAGES_SETTING = 'quickEquipmentPackages';
export const QUICK_EQUIPMENT_PACKAGE_VERSION = 1;
export const DEFAULT_QUICK_EQUIPMENT_IMAGE = 'icons/svg/item-bag.svg';

const COIN_VALUES = { gp: 100, sp: 10, cp: 1 };
const ALLOWED_RARITIES = new Set(['common', 'uncommon', 'rare', 'unique']);
export const QUICK_EQUIPMENT_CATEGORIES = ['starter', 'classLoadout', 'adventuringGear', 'specialist', 'other'];
const DEFAULT_QUICK_EQUIPMENT_CATEGORY = 'starter';

export function createQuickEquipmentPackage(overrides = {}) {
  return normalizeQuickEquipmentPackage({
    id: createPackageId(),
    name: '',
    img: DEFAULT_QUICK_EQUIPMENT_IMAGE,
    classSlugs: [],
    items: [],
    system: {
      description: { value: '' },
      level: { value: 0 },
      traits: { rarity: 'common', value: [] },
    },
    ...overrides,
  });
}

export function normalizeQuickEquipmentPackages(packages) {
  if (!Array.isArray(packages)) return [];
  const seenIds = new Set();
  const normalized = [];

  for (const rawPackage of packages) {
    const entry = normalizeQuickEquipmentPackage(rawPackage);
    if (!entry.id || seenIds.has(entry.id)) entry.id = createPackageId();
    seenIds.add(entry.id);
    normalized.push(entry);
  }

  return normalized;
}

export function normalizeQuickEquipmentPackage(rawPackage = {}) {
  const rawSystem = isObject(rawPackage.system) ? rawPackage.system : {};
  const rawTraits = isObject(rawSystem.traits) ? rawSystem.traits : {};
  const items = normalizePackageItems(rawPackage.items ?? rawSystem.items);
  const priceCp = equipmentEntriesTotalCopper(items);
  const bulkUnits = equipmentEntriesTotalBulkUnits(items);
  const price = copperToCoins(priceCp);
  const bulkValue = bulkUnits / 10;
  const rarity = normalizeRarity(rawPackage.rarity ?? rawTraits.rarity);
  const traits = normalizeStringList(rawPackage.traits ?? rawTraits.value);
  const description = normalizeDescription(rawPackage.description ?? rawSystem.description);
  const level = normalizeNonNegativeInteger(rawPackage.level ?? rawSystem.level?.value);

  return {
    id: normalizeString(rawPackage.id) || createPackageId(),
    version: QUICK_EQUIPMENT_PACKAGE_VERSION,
    type: 'kit',
    name: normalizeString(rawPackage.name),
    img: normalizeString(rawPackage.img) || DEFAULT_QUICK_EQUIPMENT_IMAGE,
    classSlugs: normalizeSlugList(rawPackage.classSlugs ?? rawPackage.classSlug),
    category: normalizeQuickEquipmentCategory(rawPackage.category),
    items,
    priceCp,
    priceLabel: formatCoins(price),
    bulkUnits,
    bulkLabel: formatBulkUnits(bulkUnits),
    system: {
      description: { value: description },
      level: { value: level },
      price: { value: price, per: 1 },
      bulk: { value: bulkValue, per: 1 },
      traits: { rarity, value: traits },
    },
  };
}

export function packageItemFromDocument(item, quantity = 1) {
  if (!item) return null;
  const system = item.system ?? {};
  const pricePer = normalizePositiveInteger(system.price?.per, 1);
  const bulkPer = normalizePositiveInteger(system.bulk?.per, 1);

  return normalizePackageItem({
    uuid: item.uuid ?? item.flags?.core?.sourceId,
    name: item.name,
    img: item.img,
    type: item.type,
    quantity,
    level: system.level?.value,
    rarity: system.traits?.rarity,
    traits: system.traits?.value,
    description: system.description?.value,
    price: system.price?.value,
    pricePer,
    bulk: system.bulk?.value,
    bulkPer,
  });
}

export function mergePackageItems(items, additions) {
  const merged = normalizePackageItems(items);
  for (const addition of normalizePackageItems(additions)) {
    const existing = merged.find((entry) => entry.uuid === addition.uuid);
    if (existing) existing.quantity += addition.quantity;
    else merged.push(addition);
  }
  return merged;
}

export function equipmentEntriesTotalCopper(entries) {
  return normalizePackageItems(entries).reduce((total, entry) => {
    const batchPrice = coinsToCopper(entry.price);
    const batches = Math.ceil(entry.quantity / entry.pricePer);
    return total + (batchPrice * batches);
  }, 0);
}

export function equipmentEntriesTotalBulkUnits(entries) {
  return normalizePackageItems(entries).reduce((total, entry) => {
    const bulkUnits = bulkValueToUnits(entry.bulk);
    const batches = Math.ceil(entry.quantity / entry.bulkPer);
    return total + (bulkUnits * batches);
  }, 0);
}

export function coinsToCopper(coins) {
  if (!isObject(coins)) return 0;
  return Object.entries(COIN_VALUES).reduce((total, [coin, value]) => (
    total + (normalizeNonNegativeNumber(coins[coin]) * value)
  ), 0);
}

export function copperToCoins(copper) {
  let remaining = Math.max(0, Math.round(Number(copper) || 0));
  const gp = Math.floor(remaining / COIN_VALUES.gp);
  remaining %= COIN_VALUES.gp;
  const sp = Math.floor(remaining / COIN_VALUES.sp);
  const cp = remaining % COIN_VALUES.sp;
  return { gp, sp, cp };
}

export function formatCoins(coins) {
  const parts = [];
  if (coins?.gp) parts.push(`${coins.gp} gp`);
  if (coins?.sp) parts.push(`${coins.sp} sp`);
  if (coins?.cp) parts.push(`${coins.cp} cp`);
  return parts.join(', ') || '0 gp';
}

export function bulkValueToUnits(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value * 10));
  const normalized = normalizeString(value).toLowerCase().replace(',', '.');
  if (!normalized || normalized === '-' || normalized === 'negligible') return 0;
  if (normalized === 'l' || normalized === 'light') return 1;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric * 10)) : 0;
}

export function formatBulkUnits(units) {
  const normalized = Math.max(0, Math.round(Number(units) || 0));
  const whole = Math.floor(normalized / 10);
  const light = normalized % 10;
  return light ? `${whole}.${light}` : String(whole);
}

export function getQuickEquipmentPackages() {
  try {
    return normalizeQuickEquipmentPackages(game.settings.get(MODULE_ID, QUICK_EQUIPMENT_PACKAGES_SETTING));
  } catch (_error) {
    return [];
  }
}

export async function saveQuickEquipmentPackages(packages) {
  const normalized = normalizeQuickEquipmentPackages(packages);
  await game.settings.set(MODULE_ID, QUICK_EQUIPMENT_PACKAGES_SETTING, normalized);
  return normalized;
}

function normalizePackageItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizePackageItem).filter((item) => item.uuid);
}

function normalizePackageItem(rawItem = {}) {
  const rawSystem = isObject(rawItem.system) ? rawItem.system : {};
  const rawTraits = isObject(rawSystem.traits) ? rawSystem.traits : {};
  return {
    uuid: normalizeString(rawItem.uuid ?? rawItem.sourceId ?? rawItem.flags?.core?.sourceId),
    name: normalizeString(rawItem.name),
    img: normalizeString(rawItem.img) || DEFAULT_QUICK_EQUIPMENT_IMAGE,
    type: normalizeString(rawItem.type),
    quantity: normalizePositiveInteger(rawItem.quantity, 1),
    level: normalizeNonNegativeInteger(rawItem.level ?? rawSystem.level?.value),
    rarity: normalizeRarity(rawItem.rarity ?? rawTraits.rarity),
    traits: normalizeStringList(rawItem.traits ?? rawTraits.value),
    description: normalizeDescription(rawItem.description ?? rawSystem.description),
    price: normalizeCoins(rawItem.price ?? rawSystem.price?.value),
    pricePer: normalizePositiveInteger(rawItem.pricePer ?? rawSystem.price?.per, 1),
    bulk: normalizeBulkValue(rawItem.bulk ?? rawSystem.bulk?.value),
    bulkPer: normalizePositiveInteger(rawItem.bulkPer ?? rawSystem.bulk?.per, 1),
  };
}

function normalizeCoins(coins) {
  return {
    gp: normalizeNonNegativeNumber(coins?.gp),
    sp: normalizeNonNegativeNumber(coins?.sp),
    cp: normalizeNonNegativeNumber(coins?.cp),
  };
}

function normalizeBulkValue(value) {
  return bulkValueToUnits(value) / 10;
}

function normalizeDescription(value) {
  if (isObject(value)) return normalizeString(value.value);
  return normalizeString(value);
}

function normalizeRarity(value) {
  const normalized = normalizeString(value).toLowerCase();
  return ALLOWED_RARITIES.has(normalized) ? normalized : 'common';
}

function normalizeQuickEquipmentCategory(value) {
  const normalized = normalizeString(value);
  return QUICK_EQUIPMENT_CATEGORIES.includes(normalized) ? normalized : DEFAULT_QUICK_EQUIPMENT_CATEGORY;
}

function normalizeStringList(value) {
  const entries = Array.isArray(value) ? value : normalizeString(value).split(',');
  return [...new Set(entries.map(normalizeString).filter(Boolean))];
}

function normalizeSlugList(value) {
  return normalizeStringList(value)
    .map((entry) => entry.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function normalizeNonNegativeInteger(value) {
  return Math.floor(normalizeNonNegativeNumber(value));
}

function normalizePositiveInteger(value, fallback) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function createPackageId() {
  if (typeof globalThis.foundry?.utils?.randomID === 'function') return foundry.utils.randomID();
  if (typeof globalThis.crypto?.randomUUID === 'function') return crypto.randomUUID();
  return `quick-equipment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
