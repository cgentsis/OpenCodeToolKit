const path = require('path');
const {
  extractRegistry,
  registryNames,
  checkRegistryEntries,
  checkEvalCoverage,
  listSkillNames,
  checkDiscovery,
  formatReport,
  START_MARKER,
  END_MARKER,
} = require('../skills/skill-authoring/validate-skill-set.js');

function normalize(file) {
  return file.replace(/[\\/]/g, '\\').toLowerCase();
}

function fakeFs(files = {}, entries = []) {
  const store = Object.fromEntries(
    Object.entries(files).map(([key, value]) => [normalize(key), value])
  );
  return {
    readFileSync(file) {
      const key = normalize(file);
      if (!(key in store)) throw new Error(`missing ${file}`);
      return store[key];
    },
    existsSync(file) {
      return normalize(file) in store;
    },
    readdirSync() {
      return entries.map((entry) => ({
        name: entry,
        isDirectory: () => !entry.includes('.'),
      }));
    },
  };
}

describe('skill-authoring validator helpers', () => {
  test('extracts a marked registry block and rejects missing markers', () => {
    const content = `before\n${START_MARKER}\n- \`alpha\`\n${END_MARKER}\nafter`;
    expect(extractRegistry(content, 'REG.md').block.trim()).toBe('- `alpha`');
    expect(extractRegistry('no markers', 'REG.md').error).toMatch(/missing registry markers/);
    expect(extractRegistry(`${END_MARKER}\n${START_MARKER}`, 'REG.md').error)
      .toMatch(/misordered/);
  });

  test('extracts backticked skill names from a registry block', () => {
    expect(registryNames('- `alpha`\n- `beta-skill`')).toEqual(['alpha', 'beta-skill']);
  });

  test('reports missing entries and stale names after rename or remove', () => {
    const errors = checkRegistryEntries(
      ['alpha', 'beta'],
      { 'REG.md': '- `alpha`\n- `retired`' }
    );
    expect(errors).toContain('REG.md: missing registry entry for beta');
    expect(errors).toContain('REG.md: stale registry entry for retired');
  });

  test('reports eval coverage warnings and schema errors with an injected validator', () => {
    const errors = checkEvalCoverage(
      {
        skills: [{ name: 'alpha', evalPath: 'a', triggerPath: 't' }],
        warnings: ['beta: no eval files'],
      },
      () => ['schema failure']
    );
    expect(errors).toEqual(['eval coverage: beta: no eval files', 'eval schema: schema failure']);
  });

  test('lists only skill directories that contain SKILL.md', () => {
    const fsLib = fakeFs(
      { 'skills/alpha/SKILL.md': 'name: alpha' },
      ['alpha', 'beta', '_shared', 'README.md']
    );
    expect(listSkillNames('skills', fsLib)).toEqual(['alpha']);
  });

  test('checks that opencode.jsonc registers ./skills', () => {
    const configPath = path.join('/root', 'opencode.jsonc');
    const ok = fakeFs({ [configPath]: '{ "skills": { "paths": ["./skills"] } }' });
    expect(checkDiscovery('/root', ok)).toEqual([]);
    const bad = fakeFs({ [configPath]: '{ "skills": { "paths": [] } }' });
    expect(checkDiscovery('/root', bad)[0]).toMatch(/does not register/);
    const missing = fakeFs({});
    expect(checkDiscovery('/root', missing)[0]).toMatch(/cannot read/);
  });

  test('formats counts and errors into a readable report', () => {
    const report = formatReport({ skillCount: 2, evalSuiteCount: 1, errors: ['bad'] });
    expect(report).toContain('Skills discovered: 2');
    expect(report).toContain('Eval suites: 1');
    expect(report).toContain('Errors: 1');
    expect(report).toContain('! bad');
  });
});
