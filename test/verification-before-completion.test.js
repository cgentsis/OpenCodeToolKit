const {
  BASELINE_CHECKS,
  USAGE,
  buildChecks,
  collectTrackedFiles,
  truncate,
  runVerification,
  main,
} = require('../skills/verification-before-completion/verify-completion.js');

function mockSpawn(overrides = {}) {
  return jest.fn((command, args) => {
    if (command === 'git' && args[0] === 'ls-files') {
      return { status: 0, stdout: overrides.trackedFiles ?? 'scripts/one.js\nscripts/two.js\n' };
    }
    if (command === 'npm' || args.includes('npm test')) {
      return { status: overrides.npmStatus ?? 0, stdout: 'Test Suites: 4 passed, 4 total\n' };
    }
    if (args[0] === '--check') {
      return { status: overrides.nodeStatus ?? 0, stdout: '' };
    }
    if (command === 'git' && args[1] === '--check') {
      return { status: overrides.diffStatus ?? 0, stdout: overrides.diffOutput ?? '' };
    }
    return { status: 0, stdout: '' };
  });
}

function capture() {
  const lines = [];
  return { lines, log: (line) => lines.push(line) };
}

describe('verify-completion helper', () => {
  test('baseline checks are a single constant', () => {
    expect(BASELINE_CHECKS.map((check) => check.label)).toEqual([
      'npm test',
      'node --check',
      'git diff --check',
    ]);
  });

  test('expands node --check to one invocation per tracked file', () => {
    const checks = buildChecks(['a.js', 'b.js']);
    expect(checks.map((check) => check.label)).toEqual([
      'npm test',
      'node --check a.js',
      'node --check b.js',
      'git diff --check',
    ]);
  });

  test('collects tracked JavaScript files', () => {
    const spawnFn = mockSpawn();
    expect(collectTrackedFiles(spawnFn)).toEqual(['scripts/one.js', 'scripts/two.js']);
    expect(spawnFn).toHaveBeenCalledWith('git', ['ls-files', '*.js'], expect.any(Object));
  });

  test('reports success when all checks pass', () => {
    const { lines, log } = capture();
    const result = runVerification({ spawnFn: mockSpawn(), log, hasJest: () => true });

    expect(result.failed).toHaveLength(0);
    expect(lines.join('\n')).toContain('npm test: PASS');
    expect(lines.join('\n')).toContain('git diff --check: PASS');
    expect(lines.join('\n')).toContain('4 passed, 0 failed');
  });

  test('reports a failing check without hiding the others', () => {
    const { lines, log } = capture();
    const result = runVerification({
      spawnFn: mockSpawn({ diffStatus: 1, diffOutput: 'bad whitespace' }),
      log,
      hasJest: () => true,
    });

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].label).toBe('git diff --check');
    expect(lines.join('\n')).toContain('git diff --check: FAIL (exit 1)');
    expect(lines.join('\n')).toContain('bad whitespace');
  });

  test('blocks clearly when Jest is missing', () => {
    const spawnFn = mockSpawn();
    const { lines, log } = capture();
    const result = runVerification({ spawnFn, log, hasJest: () => false });

    expect(result.failed).toHaveLength(1);
    expect(lines.join('\n')).toContain('Jest is not installed');
    const ranNpm = spawnFn.mock.calls.some(([, args]) =>
      args.includes('test') || args.includes('npm test')
    );
    expect(ranNpm).toBe(false);
  });

  test('handles an empty tracked-file list', () => {
    const { lines, log } = capture();
    const result = runVerification({
      spawnFn: mockSpawn({ trackedFiles: '' }),
      log,
      hasJest: () => true,
    });

    expect(result.results).toHaveLength(2);
    expect(lines.join('\n')).not.toContain('node --check ');
  });

  test('truncates long output with a marker', () => {
    expect(truncate('x'.repeat(100), 10)).toContain('[truncated 90 chars]');
  });

  test('help flag prints usage', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(main(['--help'])).toBe(0);
    expect(spy).toHaveBeenCalledWith(USAGE);
    spy.mockRestore();
  });
});
