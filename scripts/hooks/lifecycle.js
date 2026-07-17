import { registerSettings, migrateWealthSettings } from '../settings.js';
import { migrateLegacyFeatCompendiumsSetting } from '../compendiums/catalog.js';
import { ClassRegistry } from '../classes/registry.js';
import { ensureClassRegistry } from '../classes/ensure.js';
import { registerLevelerKeybindings, registerSheetIntegration } from '../ui/sheet-integration.js';
import { ensureLevelerTemplatesLoaded } from '../ui/template-preload.js';
import { info } from '../utils/logger.js';
import { registerReviewRequestSocket } from '../access/review-requests.js';
import { registerPlanCommentsHooks } from './plan-comments-sync.js';
import { maybeOpenGmSetupWizard } from '../ui/gm-setup-wizard.js';
import { initImageZoomPreview } from '../ui/image-zoom.js';
import { MODULE_ID } from '../constants.js';

export function registerLifecycleHooks() {
  Hooks.once('init', onInit);
  Hooks.once('ready', onReady);
  Hooks.once('socketlib.ready', registerReviewRequestSocket);
}

async function onInit() {
  info('Initializing module');

  registerSettings();
  registerLevelerKeybindings();
  await migrateLegacyFeatCompendiumsSetting();
  registerClasses();
  registerHandlebarsHelpers();
  await ensureLevelerTemplatesLoaded();
}

async function onReady() {
  info('Module ready');
  await migrateWealthSettings();
  registerSheetIntegration();
  registerPlanCommentsHooks();
  maybeOpenGmSetupWizard();
  initImageZoomPreview();
}

function registerClasses() {
  ensureClassRegistry();
  info(`Registered ${ClassRegistry.getAll().length} classes`);
}

export function registerHandlebarsHelpers() {
  registerHandlebarsHelper('eq', (a, b) => a === b);
  registerHandlebarsHelper('notEqual', (a, b) => a !== b);
  registerHandlebarsHelper('or', (...args) => {
    args.pop();
    return args.some(Boolean);
  });
  registerHandlebarsHelper('capitalize', (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  registerHandlebarsHelper('titleCase', (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  });
  registerHandlebarsHelper('and', (...args) => {
    args.pop();
    return args.every(Boolean);
  });
  registerHandlebarsHelper('includes', (arr, val) => {
    return Array.isArray(arr) && arr.includes(val);
  });
  registerHandlebarsHelper('json', (obj) => {
    return JSON.stringify(obj ?? null);
  });
  registerHandlebarsHelper('signed', (num) => {
    return num >= 0 ? `+${num}` : `${num}`;
  });
  registerHandlebarsHelper('format', (key, options) => {
    return game.i18n.format(key, options.hash);
  });
  registerHandlebarsHelper('coinIcons', (coins) => {
    return new Handlebars.SafeString(buildCoinIconsHtml(coins));
  });
}

const COIN_DENOMINATIONS = [
  { code: 'pp', key: 'pp' },
  { code: 'gp', key: 'gp' },
  { code: 'sp', key: 'sp' },
  { code: 'cp', key: 'cp' },
];

function buildCoinIconsHtml(coins) {
  if (!coins || typeof coins !== 'object') return '';
  const parts = COIN_DENOMINATIONS
    .map(({ code, key }) => ({ code, value: Number(coins[key]) || 0 }))
    .filter((entry) => entry.value > 0)
    .map(({ code, value }) => (
      `<span class="coin-amount coin-amount--${code}">`
      + `<img class="coin-icon" src="modules/${MODULE_ID}/assets/coins/coin-${code}.png" alt="${code}">`
      + `<span class="coin-amount__value">${value}</span>`
      + '</span>'
    ));
  if (parts.length === 0) {
    return '<span class="coin-amount coin-amount--zero">'
      + `<img class="coin-icon" src="modules/${MODULE_ID}/assets/coins/coin-gp.png" alt="gp">`
      + '<span class="coin-amount__value">0</span>'
      + '</span>';
  }
  return `<span class="coin-amounts">${parts.join('')}</span>`;
}

function registerHandlebarsHelper(name, fn) {
  if (Handlebars.helpers?.[name]) return;
  Handlebars.registerHelper(name, fn);
}

