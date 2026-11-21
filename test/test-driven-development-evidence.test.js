const {
  validateTddEvidence,
  validateFiles,
} = require('../skills/test-driven-development/check-tdd-evidence');

const VALID = `
## Status
complete — 2026-11-21

### TDD Evidence

Red: \`npm test -- tdd\` → FAIL: expected behavior missing
Green: \`npm test -- tdd\` → PASS: 1 test passed
Refactor: renamed helper; green check stayed green
`;

const EXEMPT = `
### TDD Evidence

Exempt: docs/config-only
Reason: Documentation-only change.
`;

function errorText(result) {
  return result.errors.join(' | ');
}

describe('TDD evidence validator', () => {
  test('accepts complete Red/Green/Refactor evidence', () => {
    const result = validateTddEvidence(VALID);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('rejects a missing TDD Evidence section', () => {
    const result = validateTddEvidence('## Status\ncomplete — 2026-11-21\n');
    expect(result.ok).toBe(false);
    expect(errorText(result)).toContain('missing ### TDD Evidence section');
  });

  test.each([
    ['Red', 'Green: `npm test -- tdd` → PASS: 1 passed\nRefactor: no change'],
    ['Green', 'Red: `npm test -- tdd` → FAIL: missing behavior\nRefactor: no change'],
    ['Refactor', 'Red: `npm test -- tdd` → FAIL: missing behavior\nGreen: `npm test -- tdd` → PASS: 1 passed'],
  ])('rejects a missing %s entry', (label, body) => {
    const result = validateTddEvidence(`### TDD Evidence\n\n${body}\n`);
    expect(result.ok).toBe(false);
    expect(errorText(result)).toContain(`missing ${label} entry`);
  });

  test('rejects evidence with no observed result', () => {
    const result = validateTddEvidence(`
### TDD Evidence

Red: \`npm test -- tdd\` → FAIL:
Green: \`npm test -- tdd\` → PASS: 1 passed
Refactor: no change
`);
    expect(result.ok).toBe(false);
    expect(errorText(result)).toContain('Red must include a command and observed result');
  });

  test('rejects a Red entry that reports PASS', () => {
    const result = validateTddEvidence(`
### TDD Evidence

Red: \`npm test -- tdd\` → PASS: passed too early
Green: \`npm test -- tdd\` → PASS: 1 passed
Refactor: no change
`);
    expect(result.ok).toBe(false);
    expect(errorText(result)).toContain('Red expected FAIL, got PASS');
  });

  test('accepts a documented docs/config-only exemption', () => {
    expect(validateTddEvidence(EXEMPT).ok).toBe(true);
  });

  test('rejects an exemption without a reason', () => {
    const result = validateTddEvidence('### TDD Evidence\n\nExempt: docs/config-only\n');
    expect(result.ok).toBe(false);
    expect(errorText(result)).toContain('exemption requires a one-line Reason');
  });

  test('rejects mixed exemption and evidence as ambiguous', () => {
    const result = validateTddEvidence(`
### TDD Evidence

Exempt: docs/config-only
Reason: Docs only.
Red: \`npm test -- tdd\` → FAIL: missing behavior
`);
    expect(result.ok).toBe(false);
    expect(errorText(result)).toContain('mixed exemption and Red/Green/Refactor evidence');
  });

  test('validates multiple supplied files and fails if one is invalid', () => {
    const files = {
      '/valid.md': VALID,
      '/exempt.md': EXEMPT,
      '/invalid.md': '### TDD Evidence\n\nRefactor: no change\n',
    };
    const fsLib = { readFileSync: (file) => files[file] };
    const result = validateFiles(Object.keys(files), { fsLib });
    expect(result.ok).toBe(false);
    expect(result.results.map((item) => item.ok)).toEqual([true, true, false]);
  });

  test('fails closed on an unreadable file', () => {
    const fsLib = {
      readFileSync: () => {
        throw new Error('ENOENT');
      },
    };
    const result = validateFiles(['/missing.md'], { fsLib });
    expect(result.ok).toBe(false);
    expect(errorText(result.results[0])).toContain('cannot read /missing.md: ENOENT');
  });
});
