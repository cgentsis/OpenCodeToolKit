#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { discoverSkills } = require('./discover.js');
const { validateSkill } = require('./validate.js');
const { formatReport, printReport, hasErrors } = require('./report.js');
const { runLive } = require('./live.js');
const {
  CORE_ALIAS_SKILL,
  parseAliasRegistry,
  filterEvalWarnings,
} = require('../skill-authoring/validate-skill-set.js');

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

// A missing or unreadable core SKILL.md yields no aliases, so every warning
// stays visible. The registry is the single source of truth for exemptions.
function readAliasNames(skillsDir, fsLib = fs) {
  let core = '';
  try {
    core = fsLib.readFileSync(path.join(skillsDir, CORE_ALIAS_SKILL, 'SKILL.md'), 'utf8');
  } catch (error) {
    // Fail closed: parseAliasRegistry('') returns [].
  }
  return parseAliasRegistry(core);
}

function runOffline(skillsDir, filter = null, log = console.log, options = {}) {
  const fsLib = options.fsLib || fs;
  const discovered = discoverSkills(skillsDir, fsLib);
  const skills = filter
    ? discovered.skills.filter((skill) => skill.name === filter)
    : discovered.skills;
  const warnings = filter
    ? []
    : filterEvalWarnings(discovered.warnings, readAliasNames(skillsDir, fsLib));
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

  return runOffline(skillsDir, filter, log, options);
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

module.exports = { main, runOffline, readAliasNames, parseArgs, USAGE };
