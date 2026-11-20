function formatReport({ skills, warnings = [], results = [] }) {
  const lines = [];
  lines.push(`Eval suites found: ${skills.length}`);
  for (const skill of skills) lines.push(`  - ${skill.name}`);

  if (warnings.length) {
    lines.push('Warnings:');
    for (const warning of warnings) lines.push(`  ! ${warning}`);
  }

  const errors = results.flatMap((result) =>
    result.errors.map((error) => `${result.name}: ${error}`)
  );
  if (errors.length) {
    lines.push('Errors:');
    for (const error of errors) lines.push(`  x ${error}`);
  }

  lines.push(
    `Summary: ${skills.length} suites, ${errors.length} errors, ${warnings.length} warnings`
  );
  return lines;
}

function printReport(report, log = console.log) {
  for (const line of report) log(line);
}

function hasErrors(results) {
  return results.some((result) => result.errors.length > 0);
}

module.exports = { formatReport, printReport, hasErrors };
