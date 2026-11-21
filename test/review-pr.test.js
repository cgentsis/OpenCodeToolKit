jest.mock('child_process', () => ({ execFileSync: jest.fn() }));

const childProcess = require('child_process');
const { run } = require('../skills/review-and-pr/review-pr');

const PASSING_REPORT = { ok: true, errors: [] };

// Existing workflow tests focus on git/gh behavior; inject a passing report so
// they do not depend on a real docs/reviews/code.md fixture.
function runWithReport(options = {}) {
  return run({ checkReport: () => PASSING_REPORT, ...options });
}

let calls;

function setup(overrides = {}) {
  calls = [];
  childProcess.execFileSync.mockImplementation((cmd, args = [], opts = {}) => {
    calls.push({ cmd, args, opts });
    const key = `${cmd} ${args.join(' ')}`;

    for (const [pattern, value] of Object.entries(overrides)) {
      if (key.includes(pattern)) {
        if (value instanceof Error) throw value;
        return value;
      }
    }

    if (cmd === 'git' && args[0] === 'status') return ' M file.js\n';
    if (cmd === 'git' && args[0] === 'log') return 'Test commit';
    if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'list') return '[]';
    if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'create') {
      return 'https://github.com/example/repo/pull/1';
    }
    return '';
  });
}

function called(cmd, args) {
  return calls.some(
    (call) => call.cmd === cmd && JSON.stringify(call.args) === JSON.stringify(args)
  );
}

describe('review-and-PR skill', () => {
  beforeEach(() => {
    setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('runs without prompting in auto-approve mode', async () => {
    await expect(
      runWithReport({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' })
    ).resolves.toBeUndefined();

    expect(calls.some((call) => call.cmd === 'gh' && call.args[0] === 'pr' && call.args[1] === 'create'))
      .toBe(true);
  });

  test('skips the commit when the working tree is clean', async () => {
    setup({ 'git status': '' });

    await runWithReport({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' });

    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'commit')).toBe(false);
  });

  test('reuses an existing open PR', async () => {
    setup({ 'gh pr list': '[{"url":"https://github.com/example/repo/pull/9"}]' });

    await runWithReport({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' });

    expect(calls.some((call) => call.cmd === 'gh' && call.args[0] === 'pr' && call.args[1] === 'create'))
      .toBe(false);
  });

  test('stages only the configured paths', async () => {
    await runWithReport({
      autoApprove: true,
      branch: 'test-branch',
      baseBranch: 'main',
      paths: ['src/a.js'],
    });

    expect(called('git', ['add', '--', 'src/a.js'])).toBe(true);
  });

  test('does not push during a dry run', async () => {
    await runWithReport({ autoApprove: true, branch: 'test-branch', baseBranch: 'main', dryRun: true });

    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'push')).toBe(false);
  });

  test('rejects when the push fails', async () => {
    setup({ 'git push': new Error('push failed') });

    await expect(
      runWithReport({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' })
    ).rejects.toThrow('push failed');
  });

  test('dry run makes no gh calls and does not claim a PR was created', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await runWithReport({ autoApprove: true, branch: 'test-branch', baseBranch: 'main', dryRun: true });

      expect(calls.some((call) => call.cmd === 'gh')).toBe(false);
      const messages = logSpy.mock.calls.map((args) => args.join(' '));
      expect(messages.some((msg) => msg.includes('[dry-run]'))).toBe(true);
      expect(messages.some((msg) => msg.includes('no changes were made'))).toBe(true);
      expect(messages.some((msg) => msg.includes('PR created successfully'))).toBe(false);
    } finally {
      logSpy.mockRestore();
    }
  });

  test('dry run does not require interactive approval', async () => {
    await expect(
      runWithReport({ branch: 'test-branch', baseBranch: 'main', dryRun: true })
    ).resolves.toBeUndefined();

    expect(calls.some((call) => call.cmd === 'gh')).toBe(false);
  });

  test('shows pending changes before staging', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await runWithReport({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' });

      const messages = logSpy.mock.calls.map((args) => args.join(' '));
      expect(messages.some((msg) => msg.includes('Pending changes to stage:'))).toBe(true);
      expect(messages.some((msg) => msg.includes('M file.js'))).toBe(true);
    } finally {
      logSpy.mockRestore();
    }
  });

  test('validates changed plan task files before creating a PR', async () => {
    setup({ 'git diff': 'docs/plans/x/01-task.md\nREADME.md\n' });
    const validateFiles = jest.fn(() => ({ ok: true, results: [] }));

    await runWithReport({
      autoApprove: true,
      branch: 'test-branch',
      baseBranch: 'main',
      validateFiles,
    });

    expect(called('git', ['diff', '--name-only', 'main...HEAD', '--', 'docs/plans'])).toBe(true);
    expect(validateFiles).toHaveBeenCalledWith(['docs/plans/x/01-task.md']);
    expect(calls.some((call) => call.cmd === 'gh' && call.args[0] === 'pr' && call.args[1] === 'create'))
      .toBe(true);
  });

  test('skips TDD validation when no plan task files changed', async () => {
    setup({ 'git diff': '' });
    const validateFiles = jest.fn(() => ({ ok: true, results: [] }));

    await runWithReport({
      autoApprove: true,
      branch: 'test-branch',
      baseBranch: 'main',
      validateFiles,
    });

    expect(validateFiles).not.toHaveBeenCalled();
  });

  test('fails closed when the changed-file lookup fails', async () => {
    setup({ 'git diff': new Error('bad base ref') });

    await expect(
      runWithReport({ autoApprove: true, branch: 'test-branch', baseBranch: 'missing' })
    ).rejects.toThrow('bad base ref');
  });

  test('a failed TDD backstop blocks commit and PR creation', async () => {
    setup({ 'git diff': 'docs/plans/x/01-task.md\n' });
    const validateFiles = jest.fn(() => ({
      ok: false,
      results: [{ file: 'docs/plans/x/01-task.md', ok: false, errors: ['missing Red entry'] }],
    }));

    await expect(
      runWithReport({
        autoApprove: true,
        branch: 'test-branch',
        baseBranch: 'main',
        validateFiles,
      })
    ).rejects.toThrow('TDD evidence backstop failed');

    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'commit')).toBe(false);
    expect(calls.some((call) => call.cmd === 'gh')).toBe(false);
  });

  test('blocks before commit or gh when the review report check fails', async () => {
    const checkReport = jest.fn(() => ({
      ok: false,
      errors: ['Run code-review-gate and approve the report before committing or pushing.'],
    }));

    await expect(
      run({ checkReport, branch: 'test-branch', baseBranch: 'main', dryRun: true })
    ).rejects.toThrow('Code review report check failed');

    expect(checkReport).toHaveBeenCalledTimes(1);
    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'add')).toBe(false);
    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'commit')).toBe(false);
    expect(calls.some((call) => call.cmd === 'gh')).toBe(false);
  });

  test('blocks when the checker reports ok: false with no errors', async () => {
    const checkReport = jest.fn(() => ({ ok: false, errors: [] }));

    await expect(
      run({ checkReport, branch: 'test-branch', baseBranch: 'main', dryRun: true })
    ).rejects.toThrow('Code review report check failed');

    expect(checkReport).toHaveBeenCalledTimes(1);
    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'add')).toBe(false);
    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'commit')).toBe(false);
    expect(calls.some((call) => call.cmd === 'gh')).toBe(false);
  });

  test('exports pending-change and backstop helpers', () => {
    const mod = require('../skills/review-and-pr/review-pr');
    expect(typeof mod.hasChanges).toBe('function');
    expect(typeof mod.getPendingChanges).toBe('function');
    expect(typeof mod.getChangedTaskFiles).toBe('function');
    expect(typeof mod.checkTddBackstop).toBe('function');
  });
});
