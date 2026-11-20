jest.mock('child_process', () => ({ execFileSync: jest.fn() }));

const childProcess = require('child_process');
const { run } = require('../skills/review-and-pr/review-pr');

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
      run({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' })
    ).resolves.toBeUndefined();

    expect(calls.some((call) => call.cmd === 'gh' && call.args[0] === 'pr' && call.args[1] === 'create'))
      .toBe(true);
  });

  test('skips the commit when the working tree is clean', async () => {
    setup({ 'git status': '' });

    await run({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' });

    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'commit')).toBe(false);
  });

  test('reuses an existing open PR', async () => {
    setup({ 'gh pr list': '[{"url":"https://github.com/example/repo/pull/9"}]' });

    await run({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' });

    expect(calls.some((call) => call.cmd === 'gh' && call.args[0] === 'pr' && call.args[1] === 'create'))
      .toBe(false);
  });

  test('stages only the configured paths', async () => {
    await run({
      autoApprove: true,
      branch: 'test-branch',
      baseBranch: 'main',
      paths: ['src/a.js'],
    });

    expect(called('git', ['add', '--', 'src/a.js'])).toBe(true);
  });

  test('does not push during a dry run', async () => {
    await run({ autoApprove: true, branch: 'test-branch', baseBranch: 'main', dryRun: true });

    expect(calls.some((call) => call.cmd === 'git' && call.args[0] === 'push')).toBe(false);
  });

  test('rejects when the push fails', async () => {
    setup({ 'git push': new Error('push failed') });

    await expect(
      run({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' })
    ).rejects.toThrow('push failed');
  });

  test('dry run makes no gh calls and does not claim a PR was created', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await run({ autoApprove: true, branch: 'test-branch', baseBranch: 'main', dryRun: true });

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
      run({ branch: 'test-branch', baseBranch: 'main', dryRun: true })
    ).resolves.toBeUndefined();

    expect(calls.some((call) => call.cmd === 'gh')).toBe(false);
  });

  test('shows pending changes before staging', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await run({ autoApprove: true, branch: 'test-branch', baseBranch: 'main' });

      const messages = logSpy.mock.calls.map((args) => args.join(' '));
      expect(messages.some((msg) => msg.includes('Pending changes to stage:'))).toBe(true);
      expect(messages.some((msg) => msg.includes('M file.js'))).toBe(true);
    } finally {
      logSpy.mockRestore();
    }
  });

  test('exports pending-change helpers', () => {
    const mod = require('../skills/review-and-pr/review-pr');
    expect(typeof mod.hasChanges).toBe('function');
    expect(typeof mod.getPendingChanges).toBe('function');
  });
});
