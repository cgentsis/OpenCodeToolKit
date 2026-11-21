const fs = require('fs');
const path = require('path');
const { parseFrontmatter, readHead } = require('./run');

const DEFAULT_REPORT_PATH = path.join('docs', 'reviews', 'code.md');
const REMEDIATION_MESSAGE =
  'Run code-review-gate and approve the report before committing or pushing.';

function resolveReportPath(reportPath = DEFAULT_REPORT_PATH, options = {}) {
  const cwd = options.cwd || process.cwd();
  return path.resolve(cwd, reportPath);
}

// Read a report from disk and return its frontmatter fields plus Markdown body.
// Read failures propagate so checkReviewReport can fail closed.
function parseReportFile(reportPath = DEFAULT_REPORT_PATH, options = {}) {
  const { fsLib = fs } = options;
  return parseFrontmatter(fsLib.readFileSync(resolveReportPath(reportPath, options), 'utf8'));
}

// An explicit `head` (or `getHead`) is used for tests; production falls back to
// `git rev-parse HEAD` via the shared runner helper.
function resolveHead(options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'head')) return options.head;
  if (typeof options.getHead === 'function') return options.getHead(options);
  return readHead({ spawnFn: options.spawnFn, cwd: options.cwd });
}

function checkReviewReport(options = {}) {
  const reportPath = options.reportPath || DEFAULT_REPORT_PATH;
  const resolvedPath = resolveReportPath(reportPath, options);
  const errors = [];

  let report;
  try {
    report = parseReportFile(reportPath, options);
  } catch (error) {
    return {
      ok: false,
      reportPath: resolvedPath,
      head: null,
      errors: [
        `Review report is missing or unreadable at ${resolvedPath}: ${error.message}. ${REMEDIATION_MESSAGE}`,
      ],
    };
  }

  if (report.approved !== true) {
    errors.push(
      `Review report is not approved (expected approved: true, got ${JSON.stringify(report.approved)}). ${REMEDIATION_MESSAGE}`
    );
  }
  if (report.scripted_verdict !== 'pass') {
    errors.push(
      `Review report scripted verdict is ${JSON.stringify(report.scripted_verdict)} (expected "pass"). ${REMEDIATION_MESSAGE}`
    );
  }

  let head = null;
  try {
    head = resolveHead(options);
  } catch (error) {
    errors.push(`Unable to determine current HEAD: ${error.message}. ${REMEDIATION_MESSAGE}`);
  }
  if (head == null || head === '' || head === 'unknown') {
    if (!errors.some((message) => message.startsWith('Unable to determine current HEAD'))) {
      errors.push(`Unable to determine current HEAD. ${REMEDIATION_MESSAGE}`);
    }
  } else if (report.head !== head) {
    errors.push(
      `Review report head ${JSON.stringify(report.head)} does not match current HEAD "${head}". ${REMEDIATION_MESSAGE}`
    );
  }

  return { ok: errors.length === 0, errors, reportPath: resolvedPath, head };
}

module.exports = {
  checkReviewReport,
  parseReportFile,
  resolveReportPath,
  resolveHead,
  DEFAULT_REPORT_PATH,
  REMEDIATION_MESSAGE,
};
