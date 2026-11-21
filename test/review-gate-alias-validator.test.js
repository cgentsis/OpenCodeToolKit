const path = require('path');
const {
  parseAliasRegistry,
  getAliasDeclarations,
  checkAliasRegistry,
  filterEvalWarnings,
  checkEvalCoverage,
  validateSkillSet,
  CORE_ALIAS_SKILL,
  START_MARKER,
  END_MARKER,
} = require('../skills/skill-authoring/validate-skill-set.js');

const ROOT = path.resolve(path.sep, 'repo');
const WRAPPER = 'code-review-gate';
const PLAIN = 'plain-skill';

function normalize(file) {
  return String(file).replace(/[\\/]/g, '/').toLowerCase();
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
      return entries.map((name) => ({ name, isDirectory: () => !name.includes('.') }));
    },
  };
}

function skillMd(fields = {}) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) lines.push(`${key}: ${JSON.stringify(value)}`);
  return `${lines.concat('---', '# skill').join('\n')}\n`;
}

function registry(names) {
  return [
    'before',
    START_MARKER,
    ...names.map((name) => `- \`${name}\``),
    END_MARKER,
    'after',
  ].join('\n');
}

function fsWithSkills({ aliases = [WRAPPER], wrapperAliasOf = CORE_ALIAS_SKILL } = {}) {
  const skillsDir = path.join(ROOT, 'skills');
  return fakeFs({
    [path.join(skillsDir, CORE_ALIAS_SKILL, 'SKILL.md')]: skillMd({ aliases }),
    [path.join(skillsDir, WRAPPER, 'SKILL.md')]: skillMd(
      wrapperAliasOf === null ? { name: WRAPPER } : { alias_of: wrapperAliasOf }
    ),
    [path.join(skillsDir, PLAIN, 'SKILL.md')]: skillMd({ name: PLAIN }),
  }, [CORE_ALIAS_SKILL, WRAPPER, PLAIN]);
}

function declarationsFor(fsLib) {
  const skillsDir = path.join(ROOT, 'skills');
  const core = fsLib.readFileSync(path.join(skillsDir, CORE_ALIAS_SKILL, 'SKILL.md'));
  return { declarations: getAliasDeclarations(skillsDir, fsLib), aliases: parseAliasRegistry(core) };
}

describe('review-gate alias-aware validator helpers', () => {
  test('parseAliasRegistry reads only valid alias names from core frontmatter', () => {
    expect(parseAliasRegistry(skillMd({ aliases: [WRAPPER, 'design-review-gate'] })))
      .toEqual([WRAPPER, 'design-review-gate']);
    expect(parseAliasRegistry(skillMd({ type: 'core' }))).toEqual([]);
    expect(parseAliasRegistry(skillMd({ aliases: ['INVALID', WRAPPER, 7] }))).toEqual([WRAPPER]);
  });

  test('declared aliases are exempt from eval coverage warnings', () => {
    const fsLib = fsWithSkills();
    const { declarations, aliases } = declarationsFor(fsLib);

    expect(aliases).toEqual([WRAPPER]);
    expect(checkAliasRegistry(declarations, aliases)).toEqual([]);

    const kept = filterEvalWarnings(
      [`${WRAPPER}: no eval files`, `${PLAIN}: no eval files`],
      aliases
    );
    expect(kept).toEqual([`${PLAIN}: no eval files`]);
    expect(checkEvalCoverage({ skills: [], warnings: kept }, () => [])).toEqual([
      `eval coverage: ${PLAIN}: no eval files`,
    ]);
  });

  test('an undeclared alias_of declaration fails', () => {
    const fsLib = fsWithSkills({ aliases: [] });
    const { declarations, aliases } = declarationsFor(fsLib);
    expect(declarations).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: WRAPPER, aliasOf: CORE_ALIAS_SKILL, hasAliasOf: true }),
    ]));

    const errors = checkAliasRegistry(declarations, aliases);
    expect(errors.some((error) => error.includes(`undeclared wrapper ${WRAPPER}`))).toBe(true);
  });

  test('stale core alias declarations and wrong alias_of targets fail', () => {
    const coreOnly = [{ name: CORE_ALIAS_SKILL, hasAliasOf: false }];
    expect(checkAliasRegistry(coreOnly, [WRAPPER, 'retired-alias'])).toEqual(expect.arrayContaining([
      expect.stringContaining(`stale alias declaration ${WRAPPER}`),
      expect.stringContaining('stale alias declaration retired-alias'),
    ]));

    expect(checkAliasRegistry(
      [{ name: WRAPPER, hasAliasOf: false }],
      [WRAPPER]
    )[0]).toMatch(/missing alias_of/);

    expect(checkAliasRegistry(
      [{ name: WRAPPER, hasAliasOf: true, aliasOf: 'some-other-skill' }],
      [WRAPPER]
    )[0]).toMatch(/expected review-gate/);
  });

  test('non-alias skills still require eval files in a full validation pass', () => {
    const names = [CORE_ALIAS_SKILL, WRAPPER, PLAIN];
    const fsLib = fakeFs({
      [path.join(ROOT, 'skills', CORE_ALIAS_SKILL, 'SKILL.md')]: skillMd({ aliases: [WRAPPER] }),
      [path.join(ROOT, 'skills', WRAPPER, 'SKILL.md')]: skillMd({ alias_of: CORE_ALIAS_SKILL }),
      [path.join(ROOT, 'skills', PLAIN, 'SKILL.md')]: skillMd({ name: PLAIN }),
      [path.join(ROOT, 'skills', 'README.md')]: registry(names),
      [path.join(ROOT, 'AGENTS.md')]: registry(names),
      [path.join(ROOT, 'opencode.jsonc')]: '{ "skills": { "paths": ["./skills"] } }',
    }, names);

    const result = validateSkillSet(ROOT, fsLib);
    expect(result.skillCount).toBe(3);
    expect(result.evalSuiteCount).toBe(0);
    expect(result.errors).toEqual(expect.arrayContaining([
      `eval coverage: ${PLAIN}: no eval files`,
    ]));
    expect(result.errors).not.toEqual(expect.arrayContaining([
      expect.stringContaining(WRAPPER),
    ]));
  });
});
