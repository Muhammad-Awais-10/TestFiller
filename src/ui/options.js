const form = document.querySelector("#settingsForm");
const status = document.querySelector("#status");
const fields = Object.fromEntries(["defaultCountry", "domain", "department", "mode", "theme", "historyLimit", "autoCopy"].map((id) => [id, document.querySelector(`#${id}`)]));

function send(type, payload = {}) { return chrome.runtime.sendMessage({ type, ...payload }); }
function setStatus(text, error = false) { status.textContent = text; status.className = error ? "error" : ""; }

function downloadCsv(history) {
  const header = ["Email", "Department", "Style", "Domain", "Website", "Generated at"];
  const rows = history.map((entry) => [entry.email, entry.department, entry.mode, entry.domain, entry.website, entry.createdAt]);
  const csv = [header, ...rows].map((row) => row.map(WebPlover.csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url; link.download = "plover-filler-email-history.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function initialize() {
  Object.entries(WebPlover.DEPARTMENTS).forEach(([value, label]) => fields.department.add(new Option(label, value)));
  Object.entries(WebPlover.MODES).forEach(([value, label]) => fields.mode.add(new Option(label, value)));
  const response = await send("GET_STATE");
  if (!response.ok) throw new Error(response.message);
  const settings = response.state.settings;
  if (settings.theme !== "system") document.documentElement.dataset.theme = settings.theme;
  Object.entries(fields).forEach(([key, field]) => { field[key === "autoCopy" ? "checked" : "value"] = settings[key]; });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const settings = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, key === "autoCopy" ? field.checked : field.value]));
  const response = await send("SAVE_SETTINGS", { settings });
  if (response.ok) {
    if (response.settings.theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = response.settings.theme;
  }
  setStatus(response.ok ? "Settings saved." : response.message, !response.ok);
});

document.querySelector("#export").addEventListener("click", async () => {
  const response = await send("GET_STATE");
  if (!response.ok) return setStatus(response.message, true);
  downloadCsv(response.state.history);
  setStatus(response.state.history.length ? "CSV exported." : "History is empty; exported header only.");
});

document.querySelector("#resetCounters").addEventListener("click", async () => {
  if (!confirm("Reset all local department counters? Existing history will stay.")) return;
  await send("RESET_COUNTERS"); setStatus("Local department counters reset.");
});

document.querySelector("#clearHistory").addEventListener("click", async () => {
  if (!confirm("Delete all locally stored email history? This cannot be undone.")) return;
  await send("CLEAR_HISTORY"); setStatus("Local history cleared.");
});

initialize().catch((error) => setStatus(error.message, true));
