const statuses = { tasks: ['todo', 'doing', 'done'], reports: ['new', 'reviewing', 'resolved'] };
function badRequest(message) { return Object.assign(new Error(message), { status: 400 }); }
function text(value, field, max, required = true) {
  if (typeof value !== 'string' || (required && !value.trim()) || value.length > max) {
    throw badRequest(`${field} must be ${required ? 'a nonempty' : 'a'} string of at most ${max} characters`);
  }
  return value.trim();
}
function validate(kind, input, partial = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw badRequest('Use a JSON object');
  const allowed = kind === 'tasks' ? ['title', 'status', 'priority'] : ['title', 'website', 'fraudType', 'description', 'status'];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw badRequest('Unknown or read-only field');
  if (partial && Object.keys(input).length === 0) throw badRequest('Provide at least one field to update');
  const output = {};
  if (!partial || 'title' in input) output.title = text(input.title, 'title', 120);
  if (!partial || 'status' in input) {
    output.status = 'status' in input ? input.status : statuses[kind][0];
    if (!statuses[kind].includes(output.status)) throw badRequest('Invalid status');
  }
  if (kind === 'tasks' && (!partial || 'priority' in input)) {
    output.priority = 'priority' in input ? input.priority : 'medium';
    if (!['low', 'medium', 'high'].includes(output.priority)) throw badRequest('Invalid priority');
  }
  if (kind === 'reports') {
    if (!partial || 'website' in input) {
      output.website = text(input.website, 'website', 500);
      let parsed;
      try { parsed = new URL(output.website); } catch { throw badRequest('website must be a valid URL'); }
      if (!['http:', 'https:'].includes(parsed.protocol)) throw badRequest('Use an HTTP or HTTPS website URL');
    }
    if (!partial || 'fraudType' in input) output.fraudType = text(input.fraudType, 'fraudType', 80);
    if (!partial || 'description' in input) output.description = text(input.description ?? '', 'description', 2000, false);
  }
  return output;
}
module.exports = { validate, statuses, badRequest };
