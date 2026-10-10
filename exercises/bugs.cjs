// These three functions intentionally contain bugs. Work here before opening solutions/.
function totalCents(rows) {
  return rows.reduce((sum, row) => sum + row.amountCents, 0);
}
function patchTask(existing, patch) {
  return { ...patch };
}
async function saveAndRespond(store, input) {
  const saved = store.save(input);
  return { status: 201, body: saved };
}
module.exports = { totalCents, patchTask, saveAndRespond };
