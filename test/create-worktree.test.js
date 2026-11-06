const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  ensureWorktree,
  sanitizeBranchName,
} = require('../skills/create-worktree-on-change/create-worktree');

describe('create-worktree-on-change skill', () => {
  let repoDir;
  let originalCwd;

  beforeAll(() => {
    originalCwd = process.cwd();
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-worktree-'));
    execFileSync('git', ['init'], { cwd: repoDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoDir });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoDir });
    fs.writeFileSync(path.join(repoDir, 'README.md'), '# test\n');
    execFileSync('git', ['add', '.'], { cwd: repoDir });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: repoDir, stdio: 'ignore' });
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  afterEach(() => {
    process.chdir(repoDir);
  });

  test('sanitizes branch names', () => {
    expect(sanitizeBranchName('My Feature!')).toBe('my-feature');
    expect(sanitizeBranchName('###')).toBe('wt-change');
  });

  test('creates a new worktree', () => {
    process.chdir(repoDir);
    const branch = ensureWorktree(`new-${Date.now()}`);

    expect(branch).toMatch(/^new-/);
    expect(process.cwd()).toBe(path.join(repoDir, 'worktrees', branch));
  });

  test('reuses an existing worktree for the same branch', () => {
    process.chdir(repoDir);
    const name = `reuse-${Date.now()}`;
    const branch = ensureWorktree(name);
    const worktreePath = process.cwd();

    process.chdir(repoDir);
    const reusedBranch = ensureWorktree(name);

    expect(reusedBranch).toBe(branch);
    expect(process.cwd()).toBe(worktreePath);
  });

  test('does not create another worktree when already inside one', () => {
    process.chdir(repoDir);
    const branch = ensureWorktree(`inside-${Date.now()}`);
    const worktreePath = process.cwd();

    const returnedBranch = ensureWorktree('different-name');

    expect(returnedBranch).toBe(branch);
    expect(process.cwd()).toBe(worktreePath);
  });
});
