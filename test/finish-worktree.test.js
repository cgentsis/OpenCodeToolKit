jest.mock('child_process', () => ({ execFileSync: jest.fn() }));

const childProcess = require('child_process');
const { run } = require('../finish-worktree.js');

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

    if (cmd === 'git' && key === 'git rev-parse --git-dir') {
      return 'C:/repo/.git/worktrees/finish-worktree\n';
    }
    if (cmd === 'git' && key === 'git rev-parse --git-common-dir') {
      return 'C:/repo/.git\n';
    }
    if (cmd === 'git' && key === 'git rev-parse --abbrev-ref HEAD') {
      return opts.cwd === 'C:/repo' ? 'main\n' : 'finish-worktree\n';
    }
    if (cmd === 'git' && key === 'git rev-parse --show-toplevel') {
      return 'C:/repo/worktrees/finish-worktree\n';
    }
    if (cmd === 'git' && args[0] === 'worktree' && args[1] === 'list') {
      return [
        'worktree C:/repo',
        'HEAD abc123',
        'branch refs/heads/main',
        '',
        'worktree C:/repo/worktrees/finish-worktree',
        'HEAD def456',
        'branch refs/heads/finish-worktree',
      ].join('\n');
    }
    if (cmd === 'git' && args[0] === 'status') return '';
    if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'view') return 'MERGED\n';
    return '';
  });
}

function called(cmd, args) {
  return calls.some(
    (call) => call.cmd === cmd && JSON.stringify(call.args) === JSON.stringify(args)
  );
}

describe('finish-worktree skill', () => {
  beforeEach(() => setup());

  afterEach(() => jest.clearAllMocks());

  test('cleans up a merged worktree using the main checkout', async () => {
    await run({});

    expect(called('git', ['-C', 'C:/repo', 'pull', '--ff-only'])).toBe(true);
    expect(
      called('git', ['-C', 'C:/repo', 'worktree', 'remove', 'C:/repo/worktrees/finish-worktree'])
    ).toBe(true);
    expect(called('git', ['-C', 'C:/repo', 'branch', '-d', 'finish-worktree'])).toBe(true);
    expect(called('gh', ['pr', 'view', 'finish-worktree', '--json', 'state', '--jq', '.state'])).toBe(true);
  });

  test('cleans up by explicit branch from the main checkout', async () => {
    await run({ branchArg: 'finish-worktree' });

    expect(called('gh', ['pr', 'view', 'finish-worktree', '--json', 'state', '--jq', '.state'])).toBe(true);
    expect(called('git', ['-C', 'C:/repo', 'worktree', 'remove', 'C:/repo/worktrees/finish-worktree'])).toBe(true);
    expect(called('git', ['-C', 'C:/repo', 'branch', '-d', 'finish-worktree'])).toBe(true);
  });

  test('refuses an unknown explicit branch', async () => {
    await expect(run({ branchArg: 'does-not-exist' })).rejects.toThrow(
      "No registered worktree for branch 'does-not-exist'"
    );
  });

  test('refuses to finish the base branch explicitly', async () => {
    await expect(run({ branchArg: 'main' })).rejects.toThrow("Cannot finish the main branch");
  });

  test('never pushes or changes remote branches', async () => {
    await run({});

    expect(calls.some((call) => call.cmd === 'git' && call.args.includes('push'))).toBe(false);
    expect(calls.some((call) => call.cmd === 'gh' && call.args[1] !== 'view')).toBe(false);
    expect(calls.some((call) => call.args.includes('-D'))).toBe(false);
  });

  test('dry run previews commands without mutating', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await run({ dryRun: true });

      const messages = logSpy.mock.calls.map((args) => args.join(' '));
      expect(messages.some((msg) => msg.includes('[dry-run] git -C C:/repo pull --ff-only'))).toBe(true);
      expect(messages.some((msg) => msg.includes('[dry-run] git -C C:/repo worktree remove'))).toBe(true);
      expect(messages.some((msg) => msg.includes('[dry-run] git -C C:/repo branch -d finish-worktree'))).toBe(true);
      expect(called('git', ['-C', 'C:/repo', 'pull', '--ff-only'])).toBe(false);
      expect(called('git', ['-C', 'C:/repo', 'worktree', 'remove', 'C:/repo/worktrees/finish-worktree'])).toBe(false);
      expect(called('git', ['-C', 'C:/repo', 'branch', '-d', 'finish-worktree'])).toBe(false);
    } finally {
      logSpy.mockRestore();
    }
  });

  test('is a no-op outside a linked worktree', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      setup({
        'git rev-parse --git-dir': 'C:/repo/.git\n',
        'git rev-parse --git-common-dir': 'C:/repo/.git\n',
      });

      await run({});

      expect(calls.some((call) => call.cmd === 'gh')).toBe(false);
      expect(logSpy.mock.calls.join(' ')).toContain('nothing to do');
    } finally {
      logSpy.mockRestore();
    }
  });

  test('refuses a detached HEAD', async () => {
    setup({ 'git rev-parse --abbrev-ref HEAD': 'HEAD\n' });

    await expect(run({})).rejects.toThrow('Detached HEAD');
  });

  test('refuses a dirty worktree', async () => {
    setup({ 'status --porcelain': ' M file.js\n' });

    await expect(run({})).rejects.toThrow('uncommitted changes');
  });

  test('refuses when the PR is not merged', async () => {
    setup({ 'gh pr view': 'OPEN\n' });

    await expect(run({})).rejects.toThrow("not MERGED");
  });

  test('fails closed when the PR lookup fails', async () => {
    setup({ 'gh pr view': new Error('not authenticated') });

    await expect(run({})).rejects.toThrow('Unable to verify PR state');
  });

  test('exports preflight helpers', () => {
    const mod = require('../finish-worktree.js');
    for (const name of ['run', 'preflight', 'isLinkedWorktree', 'getCurrentBranch', 'getMainCheckout', 'checkPrMerged']) {
      expect(typeof mod[name]).toBe('function');
    }
  });
});
