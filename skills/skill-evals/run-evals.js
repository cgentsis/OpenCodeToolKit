#!/usr/bin/env node
const path = require('path');
const { discoverSkills } = require('./discover.js');
const { validateSkill } = require('./validate.js');
const { formatReport, printReport, hasErrors } = require('./report.js');
const { runLive } = require('./live.js');

const USAGE = [
  'Usage: node skills/skill-evals/run-evals.js [options] [skill]',
  '',
  'Validates eval files for skills that have them. Offline by default.',
  '',
  'Options:',
  '  --offline        Validate eval files only (default).',
  '  --live           Advisory CLI checks. Never a pass/fail gate.',
  '  --help           Print this help.',
  '  skill            Optional skill directory name to validate only.',
  '',
  'Environment:',
  '  EVAL_TIMEOUT     Per-eval timeout in ms for --live (default 30000).',
].join('\n');

function parseArgs(argv) {
  const flags = argv.filter((arg) => arg !== '--offline' && arg !== '--live');
  return {
    help: argv.includes('--help'),
    live: argv.includes('--live'),
    filter: flags.find((arg) => !arg.startsWith('--')) || null,
  };
}

function runOffline(skillsDir, filter = null, log = console.log) {
  const discovered = discoverSkills(skillsDir);
  const skills = filter
    ? discovered.skills.filter((skill) => skill.name === filter)
    : discovered.skills;
  const warnings = filter ? [] : discovered.warnings;
  const results = skills.map((skill) => ({
    name: skill.name,
    errors: validateSkill(skill),
  }));

  printReport(formatReport({ skills, warnings, results }), log);
  return hasErrors(results) ? 1 : 0;
}

async function main(argv, skillsDir = path.join(__dirname, '..'), log = console.log, options = {}) {
  const { help, live, filter } = parseArgs(argv);
  if (help) {
    log(USAGE);
    return 0;
  }

  const discovered = discoverSkills(skillsDir);
  const skills = filter
    ? discovered.skills.filter((skill) => skill.name === filter)
    : discovered.skills;

  if (live) {
    await runLive(skills, { log, ...options });
    return 0;
  }

  return runOffline(skillsDir, filter, log);
}

if (require.main === module) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (error) => {
      console.error(`❌ ${error.message}`);
      process.exitCode = 1;
    }
  );
}

module.exports = { main, runOffline, parseArgs, USAGE };
