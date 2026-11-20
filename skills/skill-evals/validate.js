const fs = require('fs');

function readJson(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (error) {
    return { error: `cannot read ${file}: ${error.message}` };
  }
  try {
    return { value: JSON.parse(raw) };
  } catch (error) {
    return { error: `invalid JSON in ${file}: ${error.message}` };
  }
}

function validateEvalFile(data, skillName, file) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [`${file}: expected an object`];
  }
  if (data.skill_name !== skillName) {
    errors.push(
      `${file}: skill_name '${data.skill_name}' does not match skill '${skillName}'`
    );
  }
  if (!Array.isArray(data.evals) || data.evals.length === 0) {
    return [...errors, `${file}: evals must be a non-empty array`];
  }
  data.evals.forEach((item, index) => {
    const prefix = `${file}: evals[${index}]`;
    if (!item || typeof item !== 'object') {
      errors.push(`${prefix}: expected an object`);
      return;
    }
    if (item.id === undefined || item.id === null) errors.push(`${prefix}: missing id`);
    if (typeof item.prompt !== 'string' || !item.prompt.trim()) {
      errors.push(`${prefix}: missing prompt`);
    }
    if (typeof item.expected_output !== 'string' || !item.expected_output.trim()) {
      errors.push(`${prefix}: missing expected_output`);
    }
  });
  return errors;
}

function validateTriggerFile(data, file) {
  if (!Array.isArray(data) || data.length === 0) {
    return [`${file}: expected a non-empty array`];
  }
  const errors = [];
  let hasTrigger = false;
  let hasNoTrigger = false;
  data.forEach((item, index) => {
    const prefix = `${file}: [${index}]`;
    if (!item || typeof item !== 'object') {
      errors.push(`${prefix}: expected an object`);
      return;
    }
    if (typeof item.query !== 'string' || !item.query.trim()) {
      errors.push(`${prefix}: missing query`);
    }
    if (typeof item.should_trigger !== 'boolean') {
      errors.push(`${prefix}: missing boolean should_trigger`);
      return;
    }
    if (item.should_trigger) hasTrigger = true;
    else hasNoTrigger = true;
  });
  if (!hasTrigger) errors.push(`${file}: needs at least one should_trigger query`);
  if (!hasNoTrigger) errors.push(`${file}: needs at least one should_not_trigger query`);
  return errors;
}

function validateSkill(skill) {
  const errors = [];
  const evalJson = readJson(skill.evalPath);
  if (evalJson.error) errors.push(evalJson.error);
  else errors.push(...validateEvalFile(evalJson.value, skill.name, skill.evalPath));

  const triggerJson = readJson(skill.triggerPath);
  if (triggerJson.error) errors.push(triggerJson.error);
  else errors.push(...validateTriggerFile(triggerJson.value, skill.triggerPath));

  return errors;
}

module.exports = {
  validateSkill,
  validateEvalFile,
  validateTriggerFile,
  readJson,
};
