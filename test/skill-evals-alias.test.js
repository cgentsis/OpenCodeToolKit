const path = require('path');
const { runOffline, readAliasNames } = require('../skills/skill-evals/run-evals.js');

const ROOT = path.resolve(path.sep, 'repo');
const SKILLS_DIR = path.join(ROOT, 'skills');
const ALIASES = ['code-review-gate', 'design-review-gate', 'specs-review-gate'];
const PLAIN = 'plain-skill';

function normalize(file) {
  return String(file).replace(/[\\/]/g, '/').toLowerCase();
}

function fakeFs({ coreSkillMd, dirs }) {
  const store = Object.fromEntries(
    Object.entries(coreSkillMd ? { [path.join(SKILLS_DIR, 'review-gate', 'SKILL.md')]: coreSkillMd } : {})
      .map(([key, value]) => [normalize(key), value])
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
      return dirs.map((name) => ({ name, isDirectory: () => true }));
    },
  };
}

function coreSkillMd(aliases) {
  return ['---', `aliases: ${JSON.stringify(aliases)}`, '---', '# core'].join('\n');
}

function runWith(fsLib) {
  const lines = [];
  const code = runOffline(SKILLS_DIR, null, (line) => lines.push(line), { fsLib });
  return { code, output: lines.join('\n') };
}

describe('skill-evals runner alias registry', () => {
  test('suppresses warnings for declared aliases but keeps non-alias warnings', () => {
    const fsLib = fakeFs({
      coreSkillMd: coreSkillMd(ALIASES),
      dirs: ['review-gate', ...ALIASES, PLAIN],
    });

    expect(readAliasNames(SKILLS_DIR, fsLib)).toEqual(ALIASES);

    const { code, output } = runWith(fsLib);
    expect(code).toBe(0);
    for (const alias of ALIASES) expect(output).not.toContain(`${alias}: no eval files`);
    expect(output).toContain('review-gate: no eval files');
    expect(output).toContain(`${PLAIN}: no eval files`);
    expect(output).toContain('Summary: 0 suites, 0 errors, 2 warnings');
  });

  test('fails closed when the core alias registry is missing', () => {
    const fsLib = fakeFs({ coreSkillMd: null, dirs: ['code-review-gate'] });

    expect(readAliasNames(SKILLS_DIR, fsLib)).toEqual([]);

    const { code, output } = runWith(fsLib);
    expect(code).toBe(0);
    expect(output).toContain('code-review-gate: no eval files');
    expect(output).toContain('Summary: 0 suites, 0 errors, 1 warnings');
  });
});
