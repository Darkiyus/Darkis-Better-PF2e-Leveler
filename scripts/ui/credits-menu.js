import { MODULE_ID } from '../constants.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CreditsMenu extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-credits`,
    classes: ['pf2e-leveler', 'pf2e-leveler-credits'],
    position: { width: 480, height: 'auto' },
    window: { resizable: false },
  };

  static PARTS = {
    credits: {
      template: `modules/${MODULE_ID}/templates/credits-menu.hbs`,
    },
  };

  get title() {
    return game.i18n.localize('PF2E_LEVELER.CREDITS.TITLE');
  }

  async _prepareContext() {
    return {
      version: game.modules.get(MODULE_ID)?.version ?? '',
    };
  }
}
