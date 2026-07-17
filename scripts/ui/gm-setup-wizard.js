import { MODULE_ID } from '../constants.js';
import {
  applySetupPreset,
  applySetupSettings,
  createCampaignProfile,
  parseCampaignProfile,
  readSetupSettings,
  SETUP_PRESETS,
} from '../settings-profile.js';
import { runSetupDiagnostics } from '../setup-diagnostics.js';
import { invalidateCache } from '../feats/feat-cache.js';
import { getCompendiumCategoryKeys, getCompendiumKeysForCategory } from '../compendiums/catalog.js';
import { invalidateItemCache } from './item-picker.js';
import { clearSpellPickerCache } from './spell-picker.js';
import { invalidateCharacterWizardCompendiumCaches } from './character-wizard/loaders.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const SETUP_STEPS = ['welcome', 'language', 'content', 'rules', 'workflow', 'diagnostics', 'summary'];
const RELOAD_MODULE_SETTINGS = ['showPlanButton', 'ancestralParagon', 'enableDualClassSupport'];

export class GmSetupWizard extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.currentStep = 0;
    this.initial = readSetupSettings();
    this.draft = foundry.utils.deepClone(this.initial);
    this.selectedPreset = 'balanced';
    this.diagnostics = null;
    this.isRunningDiagnostics = false;
    this.isSaving = false;
  }

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-gm-setup`,
    classes: ['pf2e-leveler', 'pf2e-leveler-setup'],
    position: { width: 900, height: 760 },
    window: { resizable: true },
  };

  static PARTS = {
    setup: { template: `modules/${MODULE_ID}/templates/gm-setup-wizard.hbs` },
  };

  get title() {
    return game.i18n.localize('PF2E_LEVELER.SETUP.TITLE');
  }

  async _prepareContext() {
    const stepId = SETUP_STEPS[this.currentStep];
    const moduleSettings = this.draft.moduleSettings ?? {};
    const systemSettings = this.draft.systemSettings ?? {};
    const language = this.draft.language || game.i18n?.lang || 'en';
    return {
      steps: SETUP_STEPS.map((id, index) => ({
        id,
        index,
        label: game.i18n.localize(`PF2E_LEVELER.SETUP.STEPS.${id.toUpperCase()}`),
        active: index === this.currentStep,
        complete: index < this.currentStep,
      })),
      stepId,
      isWelcome: stepId === 'welcome',
      isLanguage: stepId === 'language',
      isContent: stepId === 'content',
      isRules: stepId === 'rules',
      isWorkflow: stepId === 'workflow',
      isDiagnostics: stepId === 'diagnostics',
      isSummary: stepId === 'summary',
      isFirst: this.currentStep === 0,
      isLast: this.currentStep === SETUP_STEPS.length - 1,
      isSaving: this.isSaving,
      moduleSettings,
      systemSettings,
      isPf2e: game.system?.id === 'pf2e',
      systemName: game.system?.title ?? game.system?.id ?? '',
      systemVersion: game.system?.version ?? '',
      foundryVersion: game.version ?? '',
      languages: [
        { value: 'en', label: 'English', selected: language === 'en' },
        { value: 'de', label: 'Deutsch', selected: language === 'de' },
        { value: 'fr', label: 'Français', selected: language === 'fr' },
        { value: 'cn', label: '简体中文', selected: language === 'cn' },
      ],
      presets: Object.keys(SETUP_PRESETS).map((key) => ({
        key,
        active: key === this.selectedPreset,
        label: game.i18n.localize(`PF2E_LEVELER.SETUP.PRESETS.${key.toUpperCase()}.NAME`),
        hint: game.i18n.localize(`PF2E_LEVELER.SETUP.PRESETS.${key.toUpperCase()}.HINT`),
      })),
      diagnostics: this.diagnostics,
      isRunningDiagnostics: this.isRunningDiagnostics,
      guidanceCount: Object.keys(moduleSettings.gmContentGuidance ?? {}).length,
      quickPackageCount: (moduleSettings.quickEquipmentPackages ?? []).length,
      customPackCount: countSelectedPacks(moduleSettings.customCompendiums),
      reloadRequired: this._requiresReload(),
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    if (!root) return;

    root.querySelectorAll('[data-action="go-step"]').forEach((button) => {
      button.addEventListener('click', () => this._goToStep(Number(button.dataset.step)));
    });
    root.querySelector('[data-action="previous"]')?.addEventListener('click', () => this._goToStep(this.currentStep - 1));
    root.querySelector('[data-action="next"]')?.addEventListener('click', () => this._goToStep(this.currentStep + 1));
    root.querySelector('[data-action="finish"]')?.addEventListener('click', () => this._finish());
    root.querySelector('[data-action="skip"]')?.addEventListener('click', () => this._skip());

    root.querySelectorAll('[data-setting]').forEach((input) => {
      input.addEventListener('change', () => this._updateDraftSetting(input));
    });
    root.querySelectorAll('[data-action="select-language"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.draft.language = button.dataset.language;
        this.render(false);
      });
    });
    root.querySelectorAll('[data-action="apply-preset"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedPreset = button.dataset.preset;
        this.draft = applySetupPreset(this.draft, this.selectedPreset);
        if (this.selectedPreset === 'restricted') this._ensurePlayerAccessSeeded();
        this.render(false);
      });
    });

    root.querySelector('[data-action="open-guidance"]')?.addEventListener('click', () => this._openMenu('./content-guidance-menu.js', 'ContentGuidanceMenu'));
    root.querySelector('[data-action="open-compendiums"]')?.addEventListener('click', () => this._openMenu('./compendium-settings-menu.js', 'CompendiumSettingsMenu'));
    root.querySelector('[data-action="open-player-compendiums"]')?.addEventListener('click', () => this._openMenu('./compendium-settings-menu.js', 'PlayerCompendiumAccessMenu'));
    root.querySelector('[data-action="open-equipment-packages"]')?.addEventListener('click', () => this._openMenu('./quick-equipment-packages-menu.js', 'QuickEquipmentPackagesMenu'));
    root.querySelector('[data-action="run-diagnostics"]')?.addEventListener('click', () => this._runDiagnostics());
    root.querySelector('[data-action="clear-caches"]')?.addEventListener('click', () => this._clearCaches());
    root.querySelector('[data-action="export-profile"]')?.addEventListener('click', () => this._exportProfile());
    root.querySelector('[data-action="import-profile"]')?.addEventListener('click', () => this._importProfile());
  }

  _goToStep(index) {
    const next = Math.max(0, Math.min(SETUP_STEPS.length - 1, Number(index) || 0));
    if (next === this.currentStep) return;
    this.currentStep = next;
    this.render(false);
  }

  _updateDraftSetting(input) {
    const namespace = input.dataset.namespace === 'system' ? 'systemSettings' : 'moduleSettings';
    const key = input.dataset.setting;
    if (!key) return;
    let value = input.type === 'checkbox' ? input.checked : input.value;
    if (input.dataset.type === 'number') value = Number(value) || 0;
    this.draft[namespace] ??= {};
    this.draft[namespace][key] = value;
  }

  async _openMenu(path, exportName) {
    const module = await import(path);
    if (!module?.[exportName]) return;
    const menu = new module[exportName]();
    const originalClose = menu.close.bind(menu);
    menu.close = async (...args) => {
      const result = await originalClose(...args);
      this._syncExternalMenuSettings(exportName);
      this.render(false);
      return result;
    };
    menu.render(true);
  }

  _syncExternalMenuSettings(exportName) {
    const keys = {
      ContentGuidanceMenu: ['gmContentGuidance'],
      CompendiumSettingsMenu: ['customCompendiums'],
      PlayerCompendiumAccessMenu: ['playerCompendiumAccess'],
      QuickEquipmentPackagesMenu: ['quickEquipmentPackages'],
    }[exportName] ?? [];
    for (const key of keys) {
      try {
        this.draft.moduleSettings[key] = foundry.utils.deepClone(game.settings.get(MODULE_ID, key));
      } catch {
        // Keep the existing draft when a setting is unavailable.
      }
    }
  }

  async _runDiagnostics() {
    if (this.isRunningDiagnostics) return;
    this.isRunningDiagnostics = true;
    this.render(false);
    try {
      this.diagnostics = await runSetupDiagnostics();
    } finally {
      this.isRunningDiagnostics = false;
      this.render(false);
    }
  }

  _clearCaches() {
    invalidateCache();
    invalidateItemCache();
    clearSpellPickerCache();
    invalidateCharacterWizardCompendiumCaches();
    this.diagnostics = null;
    ui.notifications.info(game.i18n.localize('PF2E_LEVELER.SETUP.CACHES_CLEARED'));
    this.render(false);
  }

  _exportProfile() {
    const profile = {
      ...createCampaignProfile(),
      moduleSettings: foundry.utils.deepClone(this.draft.moduleSettings),
      systemSettings: foundry.utils.deepClone(this.draft.systemSettings),
    };
    downloadJson(profile, 'pf2e-leveler-campaign-profile.json');
    ui.notifications.info(game.i18n.localize('PF2E_LEVELER.SETUP.PROFILE_EXPORTED'));
  }

  _importProfile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const profile = parseCampaignProfile(await file.text());
        this.draft.moduleSettings = {
          ...this.draft.moduleSettings,
          ...profile.moduleSettings,
        };
        this.draft.systemSettings = {
          ...this.draft.systemSettings,
          ...profile.systemSettings,
        };
        this.diagnostics = null;
        ui.notifications.info(game.i18n.localize('PF2E_LEVELER.SETUP.PROFILE_IMPORTED'));
        this.render(false);
      } catch (error) {
        ui.notifications.error(game.i18n.format('PF2E_LEVELER.SETUP.PROFILE_IMPORT_FAILED', { error: error.message }));
      }
    });
    input.click();
  }

  async _skip() {
    await game.settings.set(MODULE_ID, 'gmSetupCompleted', true);
    this.close();
  }

  async _finish() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.render(false);
    const reloadRequired = this._requiresReload();
    try {
      if (this.draft.moduleSettings?.restrictPlayerCompendiumAccess) this._ensurePlayerAccessSeeded();
      await applySetupSettings(this.draft);
      const currentLanguage = String(this.initial.language || game.i18n?.lang || 'en');
      if (this.draft.language && this.draft.language !== currentLanguage) {
        await game.settings.set('core', 'language', this.draft.language);
      }
      await game.settings.set(MODULE_ID, 'gmSetupCompleted', true);
      ui.notifications.info(game.i18n.localize('PF2E_LEVELER.SETUP.SAVED'));
      await this.close();
      if (reloadRequired) reloadFoundryInterface();
    } catch (error) {
      this.isSaving = false;
      ui.notifications.error(game.i18n.format('PF2E_LEVELER.SETUP.SAVE_FAILED', { error: error.message }));
      this.render(false);
    }
  }

  _requiresReload() {
    if (String(this.draft.language ?? '') !== String(this.initial.language ?? '')) return true;
    if (RELOAD_MODULE_SETTINGS.some((key) => this.draft.moduleSettings?.[key] !== this.initial.moduleSettings?.[key])) return true;
    return Object.keys(this.draft.systemSettings ?? {}).some((key) => this.draft.systemSettings?.[key] !== this.initial.systemSettings?.[key]);
  }

  _ensurePlayerAccessSeeded() {
    const current = this.draft.moduleSettings?.playerCompendiumAccess;
    if (current?.enabled && current?.selections) return;

    const selections = {};
    for (const category of getCompendiumCategoryKeys()) {
      const configured = this.draft.moduleSettings?.customCompendiums?.[category] ?? [];
      selections[category] = [...new Set([...getCompendiumKeysForCategory(category, { includeDefaults: true }), ...configured])];
    }
    this.draft.moduleSettings.playerCompendiumAccess = { enabled: true, selections };
  }
}

export function openGmSetupWizard() {
  return new GmSetupWizard().render(true);
}

export function maybeOpenGmSetupWizard() {
  if (!game.user?.isGM || game.settings.get(MODULE_ID, 'gmSetupCompleted')) return null;
  setTimeout(() => openGmSetupWizard(), 700);
  return true;
}

function countSelectedPacks(value) {
  const keys = new Set();
  for (const entries of Object.values(value ?? {})) {
    if (Array.isArray(entries)) entries.forEach((entry) => keys.add(entry));
  }
  return keys.size;
}

function downloadJson(value, filename) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function reloadFoundryInterface() {
  if (typeof foundry.utils?.debouncedReload === 'function') {
    foundry.utils.debouncedReload();
    return;
  }
  globalThis.location?.reload?.();
}
