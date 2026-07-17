import {
  applySetupPreset,
  applySetupSettings,
  CAMPAIGN_PROFILE_FORMAT,
  createCampaignProfile,
  parseCampaignProfile,
} from '../../scripts/settings-profile.js';

describe('campaign settings profiles', () => {
  beforeEach(() => {
    global._testSettings = {
      'pf2e-leveler': {
        playerAllowUncommon: true,
        playerAllowRare: false,
        playerAllowUnique: false,
        gmContentGuidance: { 'heritage-slug:dhampir': 'disallowed' },
      },
      pf2e: {
        freeArchetypeVariant: true,
        gradualBoostsVariant: false,
        automaticBonusVariant: 'noABP',
        mythic: 'disabled',
      },
      core: { language: 'de' },
    };
    game.settings.set.mockClear();
  });

  test('exports and validates a campaign profile', () => {
    const profile = createCampaignProfile();
    const parsed = parseCampaignProfile(JSON.stringify(profile));

    expect(profile.format).toBe(CAMPAIGN_PROFILE_FORMAT);
    expect(parsed.moduleSettings.gmContentGuidance).toEqual({ 'heritage-slug:dhampir': 'disallowed' });
    expect(parsed.systemSettings.freeArchetypeVariant).toBe(true);
  });

  test('drops unknown imported setting keys', () => {
    const parsed = parseCampaignProfile({
      format: CAMPAIGN_PROFILE_FORMAT,
      schemaVersion: 1,
      moduleSettings: { playerAllowRare: true, unsafeUnknownKey: true },
      systemSettings: { gradualBoostsVariant: true, unknownSystemKey: true },
    });

    expect(parsed.moduleSettings).toEqual({ playerAllowRare: true });
    expect(parsed.systemSettings).toEqual({ gradualBoostsVariant: true });
  });

  test('applies presets without discarding unrelated draft settings', () => {
    const draft = applySetupPreset({ moduleSettings: { enableReviewRequests: true } }, 'restricted');

    expect(draft.moduleSettings.enableReviewRequests).toBe(true);
    expect(draft.moduleSettings.playerDisallowedContentMode).toBe('hidden');
    expect(draft.moduleSettings.restrictPlayerCompendiumAccess).toBe(true);
  });

  test('applies allowed module and PF2e settings', async () => {
    await applySetupSettings({
      moduleSettings: { playerAllowRare: true, unknown: true },
      systemSettings: { gradualBoostsVariant: true, unknown: true },
    });

    expect(game.settings.set).toHaveBeenCalledWith('pf2e-leveler', 'playerAllowRare', true);
    expect(game.settings.set).toHaveBeenCalledWith('pf2e', 'gradualBoostsVariant', true);
    expect(game.settings.set).not.toHaveBeenCalledWith(expect.anything(), 'unknown', expect.anything());
  });
});
