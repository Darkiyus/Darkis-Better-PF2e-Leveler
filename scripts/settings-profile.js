import { MODULE_ID } from './constants.js';

export const CAMPAIGN_PROFILE_FORMAT = 'pf2e-leveler-campaign-profile';
export const CAMPAIGN_PROFILE_SCHEMA_VERSION = 1;

export const SETUP_MODULE_SETTING_KEYS = [
  'showPlanButton',
  'autoApplyOnLevelUp',
  'allowIncompleteCreation',
  'showPrerequisites',
  'enforcePrerequisites',
  'enableReviewRequests',
  'requireReviewApproval',
  'ignoreFreeArchetypeDedicationLock',
  'enforceSubclassDedicationRequirement',
  'hideUncommonFeats',
  'hideRareFeats',
  'playerAllowUncommon',
  'playerAllowRare',
  'playerAllowUnique',
  'publicationFilterVisibility',
  'startingWealthMode',
  'startingEquipmentGoldLimit',
  'quickEquipmentPackages',
  'ancestralParagon',
  'enableDualClassSupport',
  'restrictPlayerCompendiumAccess',
  'customCompendiums',
  'playerCompendiumAccess',
  'gmContentGuidance',
  'playerDisallowedContentMode',
];

export const SETUP_SYSTEM_SETTING_KEYS = [
  'freeArchetypeVariant',
  'gradualBoostsVariant',
  'automaticBonusVariant',
  'mythic',
];

export const SETUP_PRESETS = {
  balanced: {
    playerAllowUncommon: true,
    playerAllowRare: false,
    playerAllowUnique: false,
    playerDisallowedContentMode: 'unselectable',
    restrictPlayerCompendiumAccess: false,
    showPrerequisites: true,
    enforcePrerequisites: true,
  },
  restricted: {
    playerAllowUncommon: false,
    playerAllowRare: false,
    playerAllowUnique: false,
    playerDisallowedContentMode: 'hidden',
    restrictPlayerCompendiumAccess: true,
    showPrerequisites: true,
    enforcePrerequisites: true,
  },
  homebrew: {
    playerAllowUncommon: true,
    playerAllowRare: true,
    playerAllowUnique: false,
    playerDisallowedContentMode: 'unselectable',
    restrictPlayerCompendiumAccess: false,
    showPrerequisites: true,
    enforcePrerequisites: false,
  },
};

export function readSetupSettings() {
  return {
    moduleSettings: Object.fromEntries(SETUP_MODULE_SETTING_KEYS.map((key) => [key, safeGetSetting(MODULE_ID, key)])),
    systemSettings: Object.fromEntries(SETUP_SYSTEM_SETTING_KEYS.map((key) => [key, safeGetSetting('pf2e', key)])),
    language: String(safeGetSetting('core', 'language') ?? game.i18n?.lang ?? 'en'),
  };
}

export function createCampaignProfile() {
  const current = readSetupSettings();
  return {
    format: CAMPAIGN_PROFILE_FORMAT,
    schemaVersion: CAMPAIGN_PROFILE_SCHEMA_VERSION,
    moduleVersion: game.modules?.get?.(MODULE_ID)?.version ?? null,
    systemId: game.system?.id ?? null,
    systemVersion: game.system?.version ?? null,
    exportedAt: new Date().toISOString(),
    moduleSettings: current.moduleSettings,
    systemSettings: current.systemSettings,
  };
}

export function parseCampaignProfile(text) {
  let parsed;
  try {
    parsed = typeof text === 'string' ? JSON.parse(text) : text;
  } catch {
    throw new Error(game.i18n.localize('PF2E_LEVELER.SETUP.PROFILE_INVALID_JSON'));
  }
  if (!parsed || parsed.format !== CAMPAIGN_PROFILE_FORMAT) {
    throw new Error(game.i18n.localize('PF2E_LEVELER.SETUP.PROFILE_INVALID_FORMAT'));
  }
  if (Number(parsed.schemaVersion) !== CAMPAIGN_PROFILE_SCHEMA_VERSION) {
    throw new Error(game.i18n.localize('PF2E_LEVELER.SETUP.PROFILE_UNSUPPORTED_VERSION'));
  }
  return {
    ...parsed,
    moduleSettings: pickAllowedSettings(parsed.moduleSettings, SETUP_MODULE_SETTING_KEYS),
    systemSettings: pickAllowedSettings(parsed.systemSettings, SETUP_SYSTEM_SETTING_KEYS),
  };
}

export async function applySetupSettings({ moduleSettings = {}, systemSettings = {} } = {}) {
  for (const [key, value] of Object.entries(pickAllowedSettings(moduleSettings, SETUP_MODULE_SETTING_KEYS))) {
    await game.settings.set(MODULE_ID, key, value);
  }
  if (game.system?.id === 'pf2e') {
    for (const [key, value] of Object.entries(pickAllowedSettings(systemSettings, SETUP_SYSTEM_SETTING_KEYS))) {
      await game.settings.set('pf2e', key, value);
    }
  }
}

export function applySetupPreset(draft, presetKey) {
  const preset = SETUP_PRESETS[presetKey];
  if (!preset) return draft;
  return {
    ...draft,
    moduleSettings: {
      ...(draft?.moduleSettings ?? {}),
      ...preset,
    },
  };
}

function pickAllowedSettings(values, allowedKeys) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return {};
  const allowed = new Set(allowedKeys);
  return Object.fromEntries(Object.entries(values).filter(([key, value]) => allowed.has(key) && value !== undefined));
}

function safeGetSetting(namespace, key) {
  try {
    const value = game.settings.get(namespace, key);
    return value === undefined ? null : foundry.utils.deepClone(value);
  } catch {
    return null;
  }
}
