import { MODULE_ID, MIXED_ANCESTRY_CHOICE_FLAG, MIXED_ANCESTRY_UUID } from '../constants.js';
import { formatOr, localizeOr } from '../utils/i18n-fallback.js';

export function isMixedAncestryHeritageUuid(uuid) {
  return String(uuid ?? '').trim().toLowerCase() === MIXED_ANCESTRY_UUID;
}

export function isMixedAncestryHeritage(entry) {
  if (!entry) return false;
  return isMixedAncestryHeritageUuid(entry?.uuid)
    || String(entry?.slug ?? '').trim().toLowerCase() === 'mixed-ancestry'
    || entry?.flags?.[MODULE_ID]?.mixedAncestryHeritage === true
    || entry?.flags?.['pf2e-leveler']?.mixedAncestryHeritage === true;
}

export function createMixedAncestryHeritage(ancestry = null) {
  const ancestryName = String(ancestry?.name ?? '').trim();
  const name = localizeOr('CREATION.MIXED_ANCESTRY_NAME', 'Mixed Ancestry');
  const description = ancestryName
    ? formatOr(
      'CREATION.MIXED_ANCESTRY_DESCRIPTION_FOR',
      { ancestryName },
      'Choose a second ancestry to pair with your {ancestryName} ancestry.',
    )
    : localizeOr(
      'CREATION.MIXED_ANCESTRY_DESCRIPTION',
      'Choose a second ancestry to pair with your primary ancestry.',
    );
  return {
    uuid: MIXED_ANCESTRY_UUID,
    name,
    img: ancestry?.img ?? null,
    type: 'heritage',
    sourcePack: null,
    sourceLabel: 'PF2E Leveler',
    sourcePackage: MODULE_ID,
    sourcePackageLabel: 'PF2E Leveler',
    slug: 'mixed-ancestry',
    traits: [],
    rarity: 'uncommon',
    ancestrySlug: null,
    description,
    flags: {
      [MODULE_ID]: {
        mixedAncestryHeritage: true,
      },
    },
    system: {
      slug: 'mixed-ancestry',
      description: {
        value: `<p>${description}</p>`,
      },
      traits: {
        value: [],
        rarity: 'uncommon',
      },
      ancestry: null,
      rules: [],
    },
  };
}

export function getMixedAncestrySelectedValue(source) {
  if (!source || typeof source !== 'object') return null;
  const selected = source[MIXED_ANCESTRY_CHOICE_FLAG]
    ?? source.mixedAncestry
    ?? source.secondaryAncestry
    ?? source.uuid
    ?? source.slug
    ?? null;
  return typeof selected === 'string' && selected.length > 0 ? selected : null;
}
