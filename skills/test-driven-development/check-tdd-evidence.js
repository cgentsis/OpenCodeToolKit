#!/usr/bin/env node
const fs = require('fs');

const USAGE = [
  'Usage: node skills/test-driven-development/check-tdd-evidence.js <task-file> [more...]',
  '',
  'Validates the ### TDD Evidence section in each supplied plan task file.',
  'Exits 0 only when every file is valid. The caller supplies paths; this',
  'script does not discover files or run git.',
].join('\n');

const EXEMPTION = /^Exempt:\s*docs\/config-only\s*$/i;
const REASON = /^Reason:\s*(\S.*)$/;
const RED = /^Red:\s*(.+)$/;
const GREEN = /^Green:\s*(.+)$/;
const REFACTOR = /^Refactor:\s*(\S.*)$/;
const EVIDENCE_LINE = /`[^`]+`\s*→\s*(FAIL|PASS):\s*(\S.*)$/i;
const HEADING = /^#{2,6}\s/;

// Returns the lines between the TDD Evidence heading and the next same-or-
// higher-level heading. Missing sections produce an empty array.
function extractEvidenceSection(markdown = '') {
  const lines = String(markdown).replace(/^\uFEFF/, '').split(/\r?\n/);
  const start = lines.findIndex((line) => /^###\s+TDD Evidence\s*$/i.test(line.trim()));
  if (start === -1) return [];

  const section = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (HEADING.test(lines[i])) break;
    section.push(lines[i].trim());
  }
  return section.filter((line) => line !== '');
}

function firstMatch(lines, pattern) {
  for (const line of lines) {
    const match = pattern.exec(line);
    if (match) return match;
  }
  return null;
}

function validateEvidencePair(match, label, expectedStatus, errors) {
  if (!match) {
    errors.push(`missing ${label} entry`);
    return;
  }
  const content = match[1].trim();
  const evidence = EVIDENCE_LINE.exec(content);
  if (!evidence) {
    errors.push(`${label} must include a command and observed result`);
    return;
  }
  if (evidence[1].toUpperCase() !== expectedStatus) {
    errors.push(`${label} expected ${expectedStatus}, got ${evidence[1].toUpperCase()}`);
  }
  if (!evidence[2] || !evidence[2].trim()) {
    errors.push(`${label} must describe the observed result`);
  }
}

// Pure validation of task-file text. Exemption and full evidence are mutually
// exclusive so ambiguous files fail closed.
function validateTddEvidence(markdown = '') {
  const lines = extractEvidenceSection(markdown);
  const errors = [];
  if (lines.length === 0) {
    return { ok: false, errors: ['missing ### TDD Evidence section'] };
  }

  const exemption = firstMatch(lines, EXEMPTION);
  const reason = firstMatch(lines, REASON);
  const red = firstMatch(lines, RED);
  const green = firstMatch(lines, GREEN);
  const refactor = firstMatch(lines, REFACTOR);

  if (exemption) {
    if (!reason) errors.push('exemption requires a one-line Reason');
    if (red || green || refactor) {
      errors.push('mixed exemption and Red/Green/Refactor evidence is ambiguous');
    }
    return { ok: errors.length === 0, errors };
  }

  if (reason) errors.push('Reason is only valid with an exemption');
  validateEvidencePair(red, 'Red', 'FAIL', errors);
  validateEvidencePair(green, 'Green', 'PASS', errors);
  if (!refactor) errors.push('missing Refactor entry');

  return { ok: errors.length === 0, errors };
}

function validateFile(filePath, options = {}) {
  const { fsLib = fs } = options;
  let text;
  try {
    text = fsLib.readFileSync(filePath, 'utf8');
  } catch (error) {
    return { file: filePath, ok: false, errors: [`cannot read ${filePath}: ${error.message}`] };
  }
  const result = validateTddEvidence(text);
  return { file: filePath, ok: result.ok, errors: result.errors };
}

function validateFiles(filePaths = [], options = {}) {
  const results = filePaths.map((filePath) => validateFile(filePath, options));
  return { ok: results.length > 0 && results.every((result) => result.ok), results };
}

function main(argv = process.argv.slice(2), options = {}) {
  const { log = console.log } = options;
  if (argv.includes('--help') || argv.length === 0) {
    log(USAGE);
    return argv.includes('--help') ? 0 : 2;
  }

  const { ok, results } = validateFiles(argv, options);
  for (const result of results) {
    if (result.ok) {
      log(`PASS ${result.file}`);
    } else {
      for (const error of result.errors) log(`FAIL ${result.file}: ${error}`);
    }
  }
  const passed = results.filter((result) => result.ok).length;
  log(`Summary: ${results.length} files, ${passed} passed, ${results.length - passed} failed`);
  return ok ? 0 : 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  USAGE,
  extractEvidenceSection,
  validateTddEvidence,
  validateFile,
  validateFiles,
  main,
};
