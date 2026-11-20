const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const { main, runOffline, parseArgs, USAGE } = require('../skills/skill-evals/run-evals.js');
const { executePrompt, runLive, trimSnippet } = require('../skills/skill-evals/live.js');

let base;
let skillsDir;

function makeSkill(name, evalsObj, triggerArr, options = {}) {
  const dir = path.join(skillsDir, name, 'evals');
  fs.mkdirSync(dir, { recursive: true });
  if (evalsObj !== undefined) {
    fs.writeFileSync(path.join(dir, 'evals.json'),
      typeof evalsObj === 'string' ? evalsObj : JSON.stringify(evalsObj));
  }
  if (triggerArr !== undefined) {
    fs.writeFileSync(path.join(dir, 'trigger-evals.json'),
      typeof triggerArr === 'string' ? triggerArr : JSON.stringify(triggerArr));
  }
  if (options.skillMd !== false) {
    fs.writeFileSync(path.join(skillsDir, name, 'SKILL.md'), `name: ${name}\n`);
  }
}

function validEvals(name) {
  return {
    skill_name: name,
    evals: [{ id: 1, prompt: 'do a thing', expected_output: 'it does the thing' }],
  };
}

function validTriggers() {
  return [
    { query: 'do a thing', should_trigger: true },
    { query: 'unrelated', should_trigger: false },
  ];
}

beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-evals-'));
  skillsDir = path.join(base, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(base, { recursive: true, force: true });
});

describe('skill-evals runner', () => {
  test('parses flags and positional skill filter', () => {
    expect(parseArgs(['--offline', 'idea-discovery'])).toEqual({
      help: false,
      live: false,
      filter: 'idea-discovery',
    });
    expect(parseArgs(['--help'])).toEqual({ help: true, live: false, filter: null });
    expect(parseArgs(['--live', 'alpha'])).toEqual({
      help: false,
      live: true,
      filter: 'alpha',
    });
  });

  test('offline run passes for valid eval files', () => {
    makeSkill('alpha', validEvals('alpha'), validTriggers());
    const lines = [];
    const code = runOffline(skillsDir, null, (line) => lines.push(line));

    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('Eval suites found: 1');
    expect(lines.join('\n')).toContain('0 errors');
  });

  test('reports skill_name mismatch as an error', () => {
    makeSkill('alpha', validEvals('beta'), validTriggers());
    const lines = [];
    const code = runOffline(skillsDir, null, (line) => lines.push(line));

    expect(code).toBe(1);
    expect(lines.join('\n')).toContain("skill_name 'beta' does not match skill 'alpha'");
  });

  test('reports invalid JSON with the file path', () => {
    makeSkill('alpha', '{oops', validTriggers());
    const lines = [];
    const code = runOffline(skillsDir, null, (line) => lines.push(line));

    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('invalid JSON');
    expect(lines.join('\n')).toContain('evals.json');
  });

  test('requires both should-trigger and should-not-trigger queries', () => {
    makeSkill('alpha', validEvals('alpha'), [{ query: 'do a thing', should_trigger: true }]);
    const lines = [];
    const code = runOffline(skillsDir, null, (line) => lines.push(line));

    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('needs at least one should_not_trigger query');
  });

  test('validates only the filtered skill', () => {
    makeSkill('alpha', validEvals('alpha'), validTriggers());
    makeSkill('beta', validEvals('wrong'), validTriggers());
    const lines = [];
    const code = runOffline(skillsDir, 'alpha', (line) => lines.push(line));

    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('Eval suites found: 1');
    expect(lines.join('\n')).not.toContain('beta');
  });

  test('warns about skills without eval files without failing', () => {
    makeSkill('alpha', validEvals('alpha'), validTriggers());
    makeSkill('beta', undefined, undefined);
    const lines = [];
    const code = runOffline(skillsDir, null, (line) => lines.push(line));

    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('beta: no eval files');
    expect(lines.join('\n')).toContain('1 warnings');
  });

  test('warns about incomplete eval suites', () => {
    makeSkill('alpha', validEvals('alpha'), undefined);
    const lines = [];
    const code = runOffline(skillsDir, null, (line) => lines.push(line));

    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('alpha: incomplete eval suite (missing trigger-evals.json)');
  });

  test('help flag returns usage without validation', async () => {
    const lines = [];
    const code = await main(['--help'], skillsDir, (line) => lines.push(line));

    expect(code).toBe(0);
    expect(lines.join('\n')).toBe(USAGE);
  });
});

function fakeChild({ output = '', code = 0, close = true } = {}) {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = jest.fn();
  setImmediate(() => {
    if (output) child.stdout.emit('data', Buffer.from(output));
    if (close) child.emit('close', code);
  });
  return child;
}

describe('skill-evals live adapter', () => {
  test('starts opencode with an argument array and no shell', async () => {
    const spawnFn = jest.fn(() => fakeChild({ output: 'skill triggered\n' }));
    const result = await executePrompt('do a thing', { spawnFn });

    expect(spawnFn).toHaveBeenCalledWith('opencode', ['run', 'do a thing'], { shell: false });
    expect(result.error).toBeNull();
    expect(result.snippet).toContain('skill triggered');
  });

  test('truncates output to a bounded snippet', () => {
    expect(trimSnippet('x'.repeat(1000), '', 100)).toHaveLength(101);
  });

  test('reports a timeout and kills the child', async () => {
    const child = fakeChild({ close: false });
    const result = await executePrompt('do a thing', { spawnFn: () => child, timeout: 20 });

    expect(result.error).toContain('timeout after 20ms');
    expect(child.kill).toHaveBeenCalled();
  });

  test('reports a missing CLI without throwing', async () => {
    const spawnFn = () => { throw new Error('ENOENT'); };
    const result = await executePrompt('do a thing', { spawnFn });

    expect(result.error).toContain("cannot start 'opencode': ENOENT");
  });

  test('live mode is advisory and never fails the process', async () => {
    makeSkill('alpha', validEvals('alpha'), validTriggers());
    const discovered = require('../skills/skill-evals/discover.js').discoverSkills(skillsDir);
    const lines = [];
    const spawnFn = () => fakeChild({ output: 'advisory output\n' });
    const results = await runLive(discovered.skills, {
      log: (line) => lines.push(line),
      spawnFn,
    });

    expect(results).toHaveLength(1);
    expect(lines.join('\n')).toContain('advisory only');
    expect(lines.join('\n')).toContain('advisory output');
  });

  test('--live CLI exits 0 and prints advisory output', async () => {
    makeSkill('alpha', validEvals('alpha'), validTriggers());
    const lines = [];
    const code = await main(
      ['--live'],
      skillsDir,
      (line) => lines.push(line),
      { spawnFn: () => fakeChild({ output: 'advisory\n' }) }
    );

    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('advisory only');
  });
});
