const path = require('path');
const {
  checkReviewReport,
  parseReportFile,
  resolveReportPath,
  resolveHead,
  DEFAULT_REPORT_PATH,
  REMEDIATION_MESSAGE,
} = require('../skills/review-gate/check-review-report');
const { serializeFrontmatter } = require('../skills/review-gate/run');

const CWD = path.resolve(path.sep, 'repo');
const HEAD = 'abc123def';

function normalize(file) {
  const relative = path.isAbsolute(file) ? path.relative(CWD, file) : file;
  return String(relative).replace(/[\\/]/g, '/').toLowerCase();
}

function fakeFs(files = {}) {
  const store = Object.fromEntries(
    Object.entries(files).map(([key, value]) => [normalize(key), value])
  );
  return {
    readFileSync(file) {
      const key = normalize(file);
      if (!(key in store)) throw new Error(`missing ${file}`);
      return store[key];
    },
  };
}

function reportText(overrides = {}) {
  const fields = {
    type: 'code',
    head: HEAD,
    scripted_verdict: 'pass',
    approved: true,
    ...overrides,
  };
  return `${serializeFrontmatter(fields)}\n# Review gate report\n`;
}

function check(files, options = {}) {
  return checkReviewReport({ cwd: CWD, head: HEAD, fsLib: fakeFs(files), ...options });
}

describe('review-gate enforcement helper', () => {
  test('a missing report fails closed with the remediation message', () => {
    const result = check({});
    expect(result.ok).toBe(false);
    expect(result.reportPath).toBe(path.join(CWD, DEFAULT_REPORT_PATH));
    expect(result.head).toBeNull();
    expect(result.errors.some((error) => /missing or unreadable/.test(error))).toBe(true);
    expect(result.errors.every((error) => error.includes(REMEDIATION_MESSAGE))).toBe(true);
  });

  test('approved: false is rejected', () => {
    const result = check({ [DEFAULT_REPORT_PATH]: reportText({ approved: false }) });
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/not approved/);
    expect(result.errors[0]).toContain(REMEDIATION_MESSAGE);
  });

  test('scripted_verdict: fail is rejected', () => {
    const result = check({ [DEFAULT_REPORT_PATH]: reportText({ scripted_verdict: 'fail' }) });
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/scripted verdict/);
  });

  test('a report for a different HEAD is rejected', () => {
    const result = check(
      { [DEFAULT_REPORT_PATH]: reportText({ head: 'oldhead' }) },
      { head: 'currenthead' }
    );
    expect(result.ok).toBe(false);
    expect(result.head).toBe('currenthead');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/does not match current HEAD/);
    expect(result.errors[0]).toContain('currenthead');
  });

  test('an all-valid report returns no errors', () => {
    const fsLib = fakeFs({ [DEFAULT_REPORT_PATH]: reportText() });
    const result = checkReviewReport({ cwd: CWD, head: HEAD, fsLib });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.reportPath).toBe(path.join(CWD, DEFAULT_REPORT_PATH));
    expect(result.head).toBe(HEAD);

    const parsed = parseReportFile(DEFAULT_REPORT_PATH, { cwd: CWD, fsLib });
    expect(parsed.approved).toBe(true);
    expect(parsed.scripted_verdict).toBe('pass');
    expect(parsed.head).toBe(HEAD);
  });

  test('report path and HEAD resolution use injected values', () => {
    const customPath = 'reports/custom.md';
    const fsLib = fakeFs({ [customPath]: reportText() });
    const result = checkReviewReport({
      cwd: CWD,
      reportPath: customPath,
      fsLib,
      getHead: () => HEAD,
    });
    expect(result.ok).toBe(true);
    expect(result.reportPath).toBe(path.join(CWD, customPath));
    expect(resolveReportPath(customPath, { cwd: CWD })).toBe(path.join(CWD, customPath));
    expect(resolveHead({ head: HEAD, getHead: () => 'unused' })).toBe(HEAD);
    expect(resolveHead({ getHead: () => HEAD })).toBe(HEAD);
  });
});
