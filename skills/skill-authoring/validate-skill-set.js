#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const { discoverSkills } = require('../skill-evals/discover.js');
const { validateSkill } = require('../skill-evals/validate.js');

const DEFAULT_ROOT = path.resolve(__dirname, '..', '..');
const START_MARKER = '<!-- skill-registry:start -->';
const END_MARKER = '<!-- skill-registry:end -->';
const REGISTRY_FILES = ['skills/README.md', 'AGENTS.md'];
const CONFIG_FILE = 'opencode.jsonc';

function readFile(file, fsLib = fs) {
  try {
    return { content: fsLib.readFileSync(file, 'utf8') };
  } catch (error) {
    return { error: `cannot read ${file}: ${error.message}` };
  }
}

function extractRegistry(content, file) {
  if (!content) return { error: `${file}: missing registry markers` };
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);
  if (start === -1 || end === -1) {
    return { error: `${file}: missing registry markers` };
  }
  if (end < start) {
    return { error: `${file}: misordered registry markers` };
  }
  return { block: content.slice(start + START_MARKER.length, end) };
}

function registryNames(block) {
  return [...block.matchAll(/`([a-z0-9-]+)`/g)].map((match) => match[1]);
}

function checkRegistryEntries(names, blocks) {
  const errors = [];
  for (const [file, block] of Object.entries(blocks)) {
    for (const name of names) {
      if (!block.includes(name)) errors.push(`${file}: missing registry entry for ${name}`);
    }
    for (const listed of registryNames(block)) {
      if (!names.includes(listed)) errors.push(`${file}: stale registry entry for ${listed}`);
    }
  }
  return errors;
}

function listSkillNames(skillsDir, fsLib = fs) {
  const names = [];
  for (const entry of fsLib.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    if (fsLib.existsSync(path.join(skillsDir, entry.name, 'SKILL.md'))) names.push(entry.name);
  }
  return names;
}

function checkDiscovery(root, fsLib = fs) {
  const config = readFile(path.join(root, CONFIG_FILE), fsLib);
  if (config.error) return [config.error];
  const pathsMatch = config.content.match(/"paths"\s*:\s*\[([^\]]*)\]/);
  const registersSkills = pathsMatch && (
    pathsMatch[1].includes('"./skills"') || pathsMatch[1].includes('"skills"')
  );
  if (!registersSkills) {
    return [`${CONFIG_FILE}: skills.paths does not register ./skills`];
  }
  return [];
}

function checkEvalCoverage(discovery, validate = validateSkill) {
  const errors = discovery.warnings.map((warning) => `eval coverage: ${warning}`);
  for (const skill of discovery.skills) {
    for (const error of validate(skill)) errors.push(`eval schema: ${error}`);
  }
  return errors;
}

function collectEvalErrors(skillsDir) {
  const discovery = discoverSkills(skillsDir);
  return { errors: checkEvalCoverage(discovery), count: discovery.skills.length };
}

function validateSkillSet(root = DEFAULT_ROOT, fsLib = fs) {
  const skillsDir = path.join(root, 'skills');
  const names = listSkillNames(skillsDir, fsLib);
  const evals = collectEvalErrors(skillsDir);
  const blocks = {};
  const registryErrors = [];

  for (const relative of REGISTRY_FILES) {
    const file = path.join(root, relative);
    const read = readFile(file, fsLib);
    if (read.error) {
      registryErrors.push(read.error);
      continue;
    }
    const extracted = extractRegistry(read.content, relative);
    if (extracted.error) registryErrors.push(extracted.error);
    else blocks[relative] = extracted.block;
  }

  registryErrors.push(...checkRegistryEntries(names, blocks));
  const errors = [...evals.errors, ...registryErrors, ...checkDiscovery(root, fsLib)];
  return { errors, skillCount: names.length, evalSuiteCount: evals.count };
}

function formatReport(result) {
  const lines = [
    'Skill set validation',
    `  Skills discovered: ${result.skillCount}`,
    `  Eval suites: ${result.evalSuiteCount}`,
    `  Errors: ${result.errors.length}`,
  ];
  for (const error of result.errors) lines.push(`  ! ${error}`);
  return lines.join('\n');
}

function main(argv = [], log = console.log) {
  const root = argv.find((arg) => !arg.startsWith('-')) || DEFAULT_ROOT;
  const result = validateSkillSet(root);
  log(formatReport(result));
  return result.errors.length === 0 ? 0 : 1;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  validateSkillSet,
  extractRegistry,
  registryNames,
  checkRegistryEntries,
  checkEvalCoverage,
  listSkillNames,
  checkDiscovery,
  formatReport,
  main,
  START_MARKER,
  END_MARKER,
};
