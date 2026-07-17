import fs from 'node:fs';
import path from 'node:path';

function readManifest() {
  const manifestPath = path.resolve(process.cwd(), 'module.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function readReleaseWorkflow() {
  const workflowPath = path.resolve(process.cwd(), '.github', 'workflows', 'main.yml');
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('module manifest', () => {
  test('declares support for PF2e and SF2e systems', () => {
    const manifest = readManifest();
    const systemIds = (manifest.relationships?.systems ?? []).map((system) => system.id);

    expect(systemIds).toEqual(expect.arrayContaining(['pf2e', 'sf2e']));
  });

  test('offers German as an additional language without replacing existing translations', () => {
    const manifest = readManifest();
    const languageIds = (manifest.languages ?? []).map((language) => language.lang);

    expect(languageIds).toEqual(expect.arrayContaining(['en', 'fr', 'de', 'cn']));
    expect(manifest.languages.find((language) => language.lang === 'de')).toEqual(expect.objectContaining({
      name: 'Deutsch',
      path: 'lang/de.json',
    }));
  });

  test('release workflow stamps module manifest version from release tag before packaging', () => {
    const workflow = readReleaseWorkflow();
    const stampStepIndex = workflow.indexOf('Set Module Manifest Version From Release Tag');
    const archiveStepIndex = workflow.indexOf('Create Module Archive');
    const uploadStepIndex = workflow.indexOf('Update Release With Files');

    expect(stampStepIndex).toBeGreaterThan(-1);
    expect(archiveStepIndex).toBeGreaterThan(stampStepIndex);
    expect(uploadStepIndex).toBeGreaterThan(stampStepIndex);
    expect(workflow).not.toContain('battila7/get-version-action');
    expect(workflow).toContain('version-without-v=${version}');
    expect(workflow).toContain('TAG_NAME: ${{ github.event.release.tag_name || inputs.release_tag }}');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('VERSION: ${{steps.get_version.outputs.version-without-v}}');
    expect(workflow).toContain('.version = $version');
  });
});
