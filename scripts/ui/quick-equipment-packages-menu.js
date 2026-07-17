import { MODULE_ID } from '../constants.js';
import {
  QUICK_EQUIPMENT_CATEGORIES,
  QUICK_EQUIPMENT_PACKAGES_SETTING,
  bulkValueToUnits,
  createQuickEquipmentPackage,
  formatBulkUnits,
  formatCoins,
  getQuickEquipmentPackages,
  mergePackageItems,
  normalizeQuickEquipmentPackage,
  packageItemFromDocument,
  saveQuickEquipmentPackages,
} from '../equipment/quick-equipment-packages.js';
import { ClassRegistry } from '../classes/registry.js';
import { ensureClassRegistry } from '../classes/ensure.js';

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const QUICK_EQUIPMENT_CATEGORY_LABEL_KEYS = {
  starter: 'PF2E_LEVELER.QUICK_EQUIPMENT.CATEGORY_STARTER',
  classLoadout: 'PF2E_LEVELER.QUICK_EQUIPMENT.CATEGORY_CLASS_LOADOUT',
  adventuringGear: 'PF2E_LEVELER.QUICK_EQUIPMENT.CATEGORY_ADVENTURING_GEAR',
  specialist: 'PF2E_LEVELER.QUICK_EQUIPMENT.CATEGORY_SPECIALIST',
  other: 'PF2E_LEVELER.QUICK_EQUIPMENT.CATEGORY_OTHER',
};

export class QuickEquipmentPackagesMenu extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this._draftPackages = null;
    this.activePackageId = null;
    this._isSaving = false;
  }

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-quick-equipment-packages`,
    classes: ['pf2e-leveler', 'quick-equipment-packages-app'],
    position: { width: 920, height: 720 },
    window: { resizable: true },
  };

  static PARTS = {
    packages: {
      template: `modules/${MODULE_ID}/templates/quick-equipment-packages.hbs`,
    },
  };

  get title() {
    return game.i18n.localize('PF2E_LEVELER.QUICK_EQUIPMENT.TITLE');
  }

  async _prepareContext() {
    this._ensureDraftPackages();
    const activePackage = this._getActivePackage();
    return {
      isSaving: this._isSaving,
      packages: this._draftPackages.map((quickPackage) => ({
        ...quickPackage,
        active: quickPackage.id === this.activePackageId,
        displayName: quickPackage.name || game.i18n.localize('PF2E_LEVELER.QUICK_EQUIPMENT.NEW_PACKAGE'),
      })),
      activePackage: activePackage ? this._toTemplatePackage(activePackage) : null,
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    root?.querySelector('[data-action="newQuickEquipmentPackage"]')?.addEventListener('click', () => {
      this._createPackage();
    });
    root?.querySelectorAll('[data-action="selectQuickEquipmentPackage"]').forEach((button) => {
      button.addEventListener('click', () => this._selectPackage(button.dataset.packageId));
    });
    root?.querySelector('[data-action="deleteQuickEquipmentPackage"]')?.addEventListener('click', () => {
      this._deleteActivePackage();
    });
    root?.querySelector('[data-action="addQuickEquipmentItems"]')?.addEventListener('click', () => {
      this._openItemPicker();
    });
    root?.querySelector('[data-action="browsePackageImage"]')?.addEventListener('click', () => {
      this._browsePackageImage();
    });
    root?.querySelectorAll('[data-action="toggleQuickEquipmentClass"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => this._toggleActivePackageClass(checkbox.dataset.classSlug));
    });
    root?.querySelectorAll('[data-action="removeQuickEquipmentItem"]').forEach((button) => {
      button.addEventListener('click', () => this._removeItem(button.dataset.uuid));
    });
    root?.querySelectorAll('[data-action="incrementQuickEquipmentItem"]').forEach((button) => {
      button.addEventListener('click', () => this._changeItemQuantity(button.dataset.uuid, 1));
    });
    root?.querySelectorAll('[data-action="decrementQuickEquipmentItem"]').forEach((button) => {
      button.addEventListener('click', () => this._changeItemQuantity(button.dataset.uuid, -1));
    });
    root?.querySelectorAll('[data-package-field]').forEach((input) => {
      input.addEventListener('input', () => this._updateActivePackageField(input.dataset.packageField, input.value));
      input.addEventListener('change', () => this.render(false));
    });
    root?.querySelector('[data-action="saveQuickEquipmentPackages"]')?.addEventListener('click', () => {
      this._save();
    });
    root?.querySelector('[data-action="closeQuickEquipmentPackages"]')?.addEventListener('click', () => this.close());
  }

  _ensureDraftPackages() {
    if (this._draftPackages) return;
    this._draftPackages = foundry.utils.deepClone(getQuickEquipmentPackages());
    this.activePackageId = this._draftPackages[0]?.id ?? null;
  }

  _getActivePackage() {
    return this._draftPackages?.find((entry) => entry.id === this.activePackageId) ?? null;
  }

  _createPackage() {
    this._ensureDraftPackages();
    const quickPackage = createQuickEquipmentPackage({
      name: game.i18n.localize('PF2E_LEVELER.QUICK_EQUIPMENT.NEW_PACKAGE'),
    });
    this._draftPackages.push(quickPackage);
    this.activePackageId = quickPackage.id;
    this.render(true);
  }

  _selectPackage(packageId) {
    if (!packageId || packageId === this.activePackageId) return;
    this.activePackageId = packageId;
    this.render(true);
  }

  async _deleteActivePackage() {
    const activePackage = this._getActivePackage();
    if (!activePackage) return;
    const confirmed = await DialogV2.confirm({
      window: { title: game.i18n.localize('PF2E_LEVELER.QUICK_EQUIPMENT.DELETE_TITLE') },
      content: `<p>${game.i18n.format('PF2E_LEVELER.QUICK_EQUIPMENT.DELETE_CONFIRM', { name: activePackage.name })}</p>`,
    });
    if (!confirmed) return;
    const index = this._draftPackages.findIndex((entry) => entry.id === activePackage.id);
    this._draftPackages.splice(index, 1);
    this.activePackageId = this._draftPackages[index]?.id ?? this._draftPackages[index - 1]?.id ?? null;
    this.render(true);
  }

  _updateActivePackageField(field, value) {
    const activePackage = this._getActivePackage();
    if (!activePackage) return;

    if (field === 'description') activePackage.system.description.value = value;
    else if (field === 'level') activePackage.system.level.value = value;
    else if (field === 'rarity') activePackage.system.traits.rarity = value;
    else if (field === 'traits') activePackage.system.traits.value = value.split(',');
    else if (field === 'category') activePackage.category = value;
    else if (field === 'name' || field === 'img') activePackage[field] = value;

    this._replaceActivePackage(normalizeQuickEquipmentPackage(activePackage));
  }

  _toggleActivePackageClass(slug) {
    const activePackage = this._getActivePackage();
    if (!activePackage) return;
    if (!slug) {
      activePackage.classSlugs = [];
    } else {
      const current = new Set(activePackage.classSlugs ?? []);
      if (current.has(slug)) current.delete(slug);
      else current.add(slug);
      activePackage.classSlugs = [...current];
    }
    this._replaceActivePackage(normalizeQuickEquipmentPackage(activePackage));
    this.render(true);
  }

  _changeItemQuantity(uuid, delta) {
    const activePackage = this._getActivePackage();
    const item = activePackage?.items.find((entry) => entry.uuid === uuid);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    this._replaceActivePackage(normalizeQuickEquipmentPackage(activePackage));
    this.render(true);
  }

  _removeItem(uuid) {
    const activePackage = this._getActivePackage();
    if (!activePackage) return;
    activePackage.items = activePackage.items.filter((entry) => entry.uuid !== uuid);
    this._replaceActivePackage(normalizeQuickEquipmentPackage(activePackage));
    this.render(true);
  }

  _browsePackageImage() {
    const activePackage = this._getActivePackage();
    if (!activePackage) return;
    const picker = new FilePicker({
      type: 'image',
      current: activePackage.img,
      callback: (path) => {
        activePackage.img = path;
        this._replaceActivePackage(normalizeQuickEquipmentPackage(activePackage));
        this.render(true);
      },
    });
    picker.browse();
  }

  async _openItemPicker() {
    const activePackage = this._getActivePackage();
    if (!activePackage) return;
    const { ItemPicker } = await import('./item-picker.js');
    const pickerActor = game.user.character ?? { name: 'PF2e Leveler' };
    const picker = new ItemPicker(
      pickerActor,
      (items) => {
        const selectedItems = Array.isArray(items) ? items : [items];
        const additions = selectedItems
          .filter(Boolean)
          .map((item) => {
            const pricePer = Number(item.system?.price?.per ?? 1);
            return packageItemFromDocument(item, pricePer > 1 ? pricePer : 1);
          });
        activePackage.items = mergePackageItems(activePackage.items, additions);
        this._replaceActivePackage(normalizeQuickEquipmentPackage(activePackage));
        this.render(true);
      },
      {
        multiSelect: true,
        title: game.i18n.localize('PF2E_LEVELER.QUICK_EQUIPMENT.ADD_ITEMS'),
      },
    );
    picker.render(true);
  }

  _replaceActivePackage(quickPackage) {
    const index = this._draftPackages.findIndex((entry) => entry.id === this.activePackageId);
    if (index >= 0) this._draftPackages[index] = quickPackage;
  }

  _toTemplatePackage(quickPackage) {
    return {
      ...quickPackage,
      description: quickPackage.system.description.value,
      level: quickPackage.system.level.value,
      traitsValue: quickPackage.system.traits.value.join(', '),
      rarityCommon: quickPackage.system.traits.rarity === 'common',
      rarityUncommon: quickPackage.system.traits.rarity === 'uncommon',
      rarityRare: quickPackage.system.traits.rarity === 'rare',
      rarityUnique: quickPackage.system.traits.rarity === 'unique',
      classOptions: this._getClassOptions(quickPackage),
      categoryOptions: QUICK_EQUIPMENT_CATEGORIES.map((category) => ({
        value: category,
        label: game.i18n.localize(QUICK_EQUIPMENT_CATEGORY_LABEL_KEYS[category]),
        selected: quickPackage.category === category,
      })),
      items: quickPackage.items.map((item) => ({
        ...item,
        priceLabel: formatCoins(item.price),
        bulkLabel: formatBulkUnits(bulkValueToUnits(item.bulk)),
      })),
    };
  }

  _getClassOptions(quickPackage) {
    ensureClassRegistry();
    const selected = new Set(quickPackage.classSlugs ?? []);
    return ClassRegistry.getAll()
      .map((classDef) => ({
        slug: classDef.slug,
        name: game.i18n.localize(classDef.nameKey),
        selected: selected.has(classDef.slug),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async _save() {
    if (this._isSaving) return;
    const unnamed = this._draftPackages.find((entry) => !entry.name.trim());
    if (unnamed) {
      this.activePackageId = unnamed.id;
      ui.notifications.warn(game.i18n.localize('PF2E_LEVELER.QUICK_EQUIPMENT.NAME_REQUIRED'));
      this.render(true);
      return;
    }

    this._isSaving = true;
    this.render(false);
    try {
      this._draftPackages = await saveQuickEquipmentPackages(this._draftPackages);
      ui.notifications.info(game.i18n.localize('PF2E_LEVELER.QUICK_EQUIPMENT.SAVED'));
      this.close();
    } finally {
      this._isSaving = false;
    }
  }
}

export { QUICK_EQUIPMENT_PACKAGES_SETTING };
