const fs = require('fs');
const path = require('path');

function discoverSkills(skillsDir, fsLib = fs) {
  const entries = fsLib.readdirSync(skillsDir, { withFileTypes: true });
  const skills = [];
  const warnings = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;

    const dir = path.join(skillsDir, entry.name);
    const evalPath = path.join(dir, 'evals', 'evals.json');
    const triggerPath = path.join(dir, 'evals', 'trigger-evals.json');
    const hasEval = fsLib.existsSync(evalPath);
    const hasTrigger = fsLib.existsSync(triggerPath);

    if (hasEval && hasTrigger) {
      skills.push({ name: entry.name, dir, evalPath, triggerPath });
    } else if (hasEval || hasTrigger) {
      warnings.push(
        `${entry.name}: incomplete eval suite (missing ${
          hasEval ? 'trigger-evals.json' : 'evals.json'
        })`
      );
    } else {
      warnings.push(`${entry.name}: no eval files`);
    }
  }

  return { skills, warnings };
}

module.exports = { discoverSkills };
