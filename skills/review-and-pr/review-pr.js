const { execFileSync } = require('child_process');
const readline = require('readline');

function log(message) {
  console.log(message);
}

function getCurrentBranch() {
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    return branch === 'HEAD' ? null : branch;
  } catch {
    return null;
  }
}

function branchExists(branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', `refs/heads/${branch}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function hasChanges(paths = []) {
  const args = ['status', '--porcelain'];
  if (paths.length) args.push('--', ...paths);
  return execFileSync('git', args, { encoding: 'utf8' }).trim().length > 0;
}

function commitChanges({ message, paths = [], dryRun = false, verbose = false }) {
  if (!hasChanges(paths)) {
    log('No changes to commit; skipping commit.');
    return false;
  }

  const addArgs = paths.length ? ['add', '--', ...paths] : ['add', '.'];
  const commitArgs = ['commit', '-m', message];

  if (dryRun) {
    log(`[dry-run] git ${addArgs.join(' ')}`);
    log(`[dry-run] git ${commitArgs.join(' ')}`);
    return true;
  }

  if (verbose) log(`git ${addArgs.join(' ')}`);
  execFileSync('git', addArgs, { stdio: 'ignore' });
  if (verbose) log(`git ${commitArgs.join(' ')}`);
  execFileSync('git', commitArgs, { stdio: 'ignore' });
  return true;
}

function pushBranch(branch, { dryRun = false, verbose = false } = {}) {
  const args = ['push', '--set-upstream', 'origin', branch];

  if (dryRun) {
    log(`[dry-run] git ${args.join(' ')}`);
    return;
  }

  if (verbose) log(`git ${args.join(' ')}`);
  execFileSync('git', args, { stdio: 'inherit' });
}

function getCommitField(format) {
  try {
    return execFileSync('git', ['log', '-1', `--pretty=${format}`], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

function ensureGhAuthenticated() {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
  } catch {
    throw new Error('GitHub CLI (gh) is not installed or not authenticated. Run "gh auth login".');
  }
}

function findOpenPr(branch) {
  try {
    const output = execFileSync(
      'gh',
      ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'url', '--limit', '1'],
      { encoding: 'utf8' }
    ).trim();
    if (!output) return null;
    const items = JSON.parse(output);
    return items.length ? items[0].url : null;
  } catch (error) {
    throw new Error(`Unable to check for an existing PR: ${error.message}`);
  }
}

function createPr({ branch, baseBranch, title, body, dryRun = false, verbose = false }) {
  const existing = findOpenPr(branch);
  if (existing) {
    log(`Open PR already exists: ${existing}`);
    return existing;
  }

  const args = [
    'pr',
    'create',
    '--title',
    title,
    '--base',
    baseBranch,
    '--head',
    branch,
    '--body-file',
    '-',
  ];

  if (dryRun) {
    log(`[dry-run] gh ${args.join(' ')} (body via stdin)`);
    return null;
  }

  if (verbose) log(`gh ${args.join(' ')} (body via stdin)`);

  const url = execFileSync('gh', args, { input: body, encoding: 'utf8' }).trim();
  log(`PR created: ${url}`);
  return url;
}

function askYesNo(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function run(options = {}) {
  const branch = options.branch || process.env.BRANCH || getCurrentBranch();
  if (!branch) throw new Error('Unable to determine current branch or worktree name.');
  if (!branchExists(branch)) throw new Error(`Branch "${branch}" does not exist.`);

  const baseBranch = options.baseBranch || process.env.BASE_BRANCH || 'main';
  const commitMsg =
    options.commitMsg || process.env.COMMIT_MSG || `Auto-generated commit for ${branch}`;
  const autoApprove =
    options.autoApprove !== undefined
      ? options.autoApprove
      : process.env.AUTO_PR && process.env.AUTO_PR.toLowerCase() === 'yes';
  const dryRun =
    options.dryRun || (process.env.DRY_RUN && process.env.DRY_RUN.toLowerCase() === 'yes');
  const verbose =
    options.verbose || (process.env.VERBOSE && process.env.VERBOSE.toLowerCase() === 'yes');
  const paths =
    options.paths ||
    (process.env.COMMIT_PATHS
      ? process.env.COMMIT_PATHS.split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : []);

  commitChanges({ message: commitMsg, paths, dryRun, verbose });

  if (!autoApprove) {
    if (!process.stdin.isTTY) {
      throw new Error('Interactive prompt unavailable; set AUTO_PR=yes to continue.');
    }

    const approved = await askYesNo(`Push branch ${branch} and open a PR to ${baseBranch}?`);
    if (!approved) {
      log('User declined to open a PR.');
      return;
    }
  }

  if (!dryRun) ensureGhAuthenticated();
  pushBranch(branch, { dryRun, verbose });

  const title = options.prTitle || process.env.PR_TITLE || getCommitField('%s') || branch;
  const body =
    options.prBody ||
    process.env.PR_BODY ||
    getCommitField('%B') ||
    `Automated changes for ${branch}`;

  createPr({ branch, baseBranch, title, body, dryRun, verbose });
  log('✅ PR created successfully');
}

module.exports = { run };
