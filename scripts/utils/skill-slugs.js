import { SKILLS } from '../constants.js';
import {
  ANACHRONISM_MODULE_ID,
  getActiveSystemId,
  getActiveSystemProfile,
  getRulesetConfig,
  SYSTEM_IDS,
} from '../system-support/profiles.js';

export const SKILL_ALIASES = {
  acr: 'acrobatics',
  arc: 'arcana',
  ath: 'athletics',
  com: 'computers',
  cra: 'crafting',
  dec: 'deception',
  dip: 'diplomacy',
  itm: 'intimidation',
  med: 'medicine',
  nat: 'nature',
  occ: 'occultism',
  pil: 'piloting',
  prf: 'performance',
  rel: 'religion',
  soc: 'society',
  ste: 'stealth',
  sur: 'survival',
  thi: 'thievery',
};

export function normalizeSkillSlug(value) {
  const source = Array.isArray(value) ? value[0] : value;
  const raw = typeof source === 'string'
    ? source
    : source?.value ?? source?.slug ?? source?.id ?? source?.key ?? '';
  const normalized = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/^system\.skills\./u, '')
    .replace(/\.rank$/u, '')
    .replace(/[_\s]+/gu, '-');
  return SKILL_ALIASES[normalized] ?? normalized;
}

export function getActiveSkillSlugs() {
  if (usesAnachronismSkillList()) {
    return [
      ...new Set([
        ...SKILLS,
        ...Object.keys(getAnachronismAdditionalSkills()).map((slug) => normalizeSkillSlug(slug)),
      ]),
    ];
  }
  if (!usesStarfinderSkillList()) return [...SKILLS];

  const skills = getActiveSkillConfig();
  if (!skills || typeof skills !== 'object') return [...SKILLS];

  const slugs = Object.keys(skills)
    .map((slug) => normalizeSkillSlug(slug))
    .filter((slug) => typeof slug === 'string' && slug.length > 0);
  return slugs.length > 0 ? [...new Set(slugs)] : [...SKILLS];
}

export function isActiveSkillSlug(value) {
  const slug = normalizeSkillSlug(value);
  return !!slug && getActiveSkillSlugs().includes(slug);
}

export function getActiveSkillConfigEntry(value) {
  const slug = normalizeSkillSlug(value);
  if (!slug) return undefined;

  if (usesAnachronismSkillList()) {
    const additional = getAnachronismAdditionalSkills();
    const directAdditional = additional[slug];
    if (directAdditional) return directAdditional;
    const additionalAlias = Object.entries(SKILL_ALIASES).find(([, canonical]) => canonical === slug)?.[0];
    if (additionalAlias && additional[additionalAlias]) return additional[additionalAlias];
  }

  const skills = getActiveSkillConfig();
  if (!skills || typeof skills !== 'object') return globalThis.CONFIG?.PF2E?.skills?.[slug];

  const direct = skills[slug];
  if (direct) return direct;

  const alias = Object.entries(SKILL_ALIASES).find(([, canonical]) => canonical === slug)?.[0];
  return alias ? skills[alias] : undefined;
}

function usesStarfinderSkillList() {
  return getActiveSystemId() === SYSTEM_IDS.SF2E;
}

function usesAnachronismSkillList() {
  return getActiveSystemProfile().contentProfile === 'pf2e+sf2e-anachronism';
}

function getActiveSkillConfig() {
  if (usesStarfinderSkillList()) return getRulesetConfig({ systemId: SYSTEM_IDS.SF2E }).skills;
  return getRulesetConfig().skills;
}

function getAnachronismAdditionalSkills() {
  const module = globalThis.game?.modules?.get?.(ANACHRONISM_MODULE_ID)
    ?? globalThis.game?.modules?.contents?.find?.((entry) => entry?.id === ANACHRONISM_MODULE_ID)
    ?? globalThis.game?.modules?.[ANACHRONISM_MODULE_ID];
  const additional = module?.flags?.[ANACHRONISM_MODULE_ID]?.['pf2e-homebrew']?.skills?.additional;
  return additional && typeof additional === 'object' ? additional : {};
}
