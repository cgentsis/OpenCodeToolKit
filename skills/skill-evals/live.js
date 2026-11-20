const { spawn } = require('child_process');
const { readJson } = require('./validate.js');

function trimSnippet(stdout, stderr, maxChars) {
  const text = (stdout || stderr || '').replace(/\s+/g, ' ').trim();
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}

function executePrompt(prompt, options = {}) {
  const {
    command = 'opencode',
    timeout = Number(process.env.EVAL_TIMEOUT) || 30000,
    maxChars = 500,
    spawnFn = spawn,
  } = options;

  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timer;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    let child;
    try {
      child = spawnFn(command, ['run', prompt], { shell: false });
    } catch (error) {
      finish({
        prompt,
        snippet: '',
        durationMs: 0,
        error: `cannot start '${command}': ${error.message}`,
      });
      return;
    }

    timer = setTimeout(() => {
      if (typeof child.kill === 'function') child.kill();
      finish({
        prompt,
        snippet: trimSnippet(stdout, stderr, maxChars),
        durationMs: Date.now() - started,
        error: `timeout after ${timeout}ms`,
      });
    }, timeout);

    if (child.stdout) {
      child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    }
    if (child.stderr) {
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    }
    child.on('error', (error) => {
      finish({
        prompt,
        snippet: trimSnippet(stdout, stderr, maxChars),
        durationMs: Date.now() - started,
        error: `spawn failed: ${error.message}`,
      });
    });
    child.on('close', (code) => {
      finish({
        prompt,
        snippet: trimSnippet(stdout, stderr, maxChars),
        durationMs: Date.now() - started,
        error: code === 0 ? null : `exited ${code}`,
      });
    });
  });
}

async function runLive(skills, options = {}) {
  const log = options.log || console.log;
  log('--live is advisory only: output is informational, not a pass/fail gate.');
  const results = [];

  for (const skill of skills) {
    const parsed = readJson(skill.evalPath);
    if (parsed.error) {
      log(`  ${skill.name}: ${parsed.error}`);
      continue;
    }
    log(`${skill.name}:`);
    for (const item of parsed.value.evals || []) {
      const result = await executePrompt(item.prompt, options);
      results.push({ skill: skill.name, id: item.id, ...result });
      const detail = result.error || result.snippet || '(no output)';
      log(`  ${item.id}: ${detail} (${result.durationMs}ms)`);
    }
  }

  return results;
}

module.exports = { executePrompt, runLive, trimSnippet };
