// Reference answers. Explain each change before applying it to exercises/bugs.cjs.
function totalCents(rows) {
  return rows.reduce((sum, row) => sum + Number(row.amountCents), 0);
}
function patchTask(existing, patch) {
  return { ...existing, ...patch, id: existing.id };
}
async function saveAndRespond(store, input) {
  const saved = await store.save(input);
  return { status: 201, body: saved };
}
module.exports = { totalCents, patchTask, saveAndRespond };
