// review-pr.js – robust, configurable review‑and‑PR helper
const { execSync } = require('child_process');
const path = require('path');
let question;
// Try to import the OpenCode SDK question helper; fall back to a simple prompt later.
try {
  ({ question } = require('openai'));
} catch (_) {
  // SDK not available – interactive mode will be disabled.
}

/**
 * Determine the current branch name.
 * Works for both normal repositories and git worktrees.
 * Returns a string with the branch/worktree name, or null on failure.
 */
function getCurrentBranch() {
  const cwd = process.cwd();
  const gitPath = path.join(cwd, '.git');
  const fs = require('fs');

  // Worktree case – .git is a plain file.
  if (fs.existsSync(gitPath) && fs.statSync(gitPath).isFile()) {
    // In a worktree the directory name is the branch name.
    return path.basename(cwd);
  }

  // Normal repo – ask git for the current branch.
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/** Execute a command and exit on failure, printing a clear error. */
function execOrFail(cmd, opts = {}) {
  try {
    return execSync(cmd, opts);
  } catch (e) {
    console.error(`❌ Command failed: ${cmd}\n${e.message}`);
    process.exit(1);
  }
}

function commitAll(message) {
  execOrFail('git add .', { stdio: 'ignore' });
  execOrFail(`git commit -m "${message}"`, { stdio: 'ignore' });
}

/**
 * Push the branch and open a PR via the GitHub CLI.
 * Generates a helpful PR body from the last commit message.
 */
function pushAndCreatePR(branch, baseBranch) {
  // Idempotent push – create the upstream on first run, otherwise just push.
  execOrFail(`git push --set-upstream origin ${branch} || git push origin ${branch}`, { stdio: 'ignore' });

  // Build PR description from the most recent commit message.
  let body = '';
  try {
    body = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
  } catch (_) {
    body = 'Auto‑generated PR';
  }

  execOrFail(
    `gh pr create --title "${branch}" --base ${baseBranch} --head ${branch} --body "${body.replace(/"/g, '\\"')}"`,
    { stdio: 'inherit' }
  );
}

async function run(options = {}) {
  const branch = options.branch || getCurrentBranch();
  if (!branch) {
    console.error('Unable to determine current branch or worktree name.');
    process.exit(1);
  }

  const baseBranch = options.baseBranch || process.env.BASE_BRANCH || 'main';
  const commitMsg = options.commitMsg || `Auto‑generated commit for ${branch}`;
  const autoApprove =
    options.autoApprove !== undefined
      ? options.autoApprove
      : process.env.AUTO_PR && process.env.AUTO_PR.toLowerCase() === 'yes';

  // Stage and commit all changes.
  commitAll(commitMsg);

  if (autoApprove) {
    pushAndCreatePR(branch, baseBranch);
    console.log('✅ PR created automatically (AUTO_PR=yes)');
    return;
  }

  if (!question) {
    console.error('Interactive mode unavailable – set AUTO_PR=yes to skip prompting.');
    process.exit(1);
  }

  const answers = await question({
    questions: [{
      name: 'review',
      type: 'list',
      message: `Push branch ${branch} and open a PR to ${baseBranch}?`,
      choices: ['Yes', 'No']
    }]
  });

  if (answers[0] === 'Yes') {
    pushAndCreatePR(branch, baseBranch);
    console.log('✅ PR created successfully');
  } else {
    console.log('⚠️ User declined to open a PR');
  }
}

module.exports = { run };

