const form = document.querySelector("#settingsForm");
const status = document.querySelector("#status");
const settingsPanel = document.querySelector("#settingsPanel");
const historyPanel = document.querySelector("#historyPanel");
const tabs = [...document.querySelectorAll(".tabs a")];
const historyList = document.querySelector("#history");
const search = document.querySelector("#search");
const historySummary = document.querySelector("#historySummary");
const fields = Object.fromEntries(["namePrefix", "nameSuffix", "aliasPrefix", "domain", "department", "mode", "company", "otherPrefix", "otherSuffix", "defaultCountry", "theme", "historyLimit", "autoCopy"].map((id) => [id, document.querySelector(`#${id}`)]));
const countryButton = document.querySelector("#countryButton");
const countryList = document.querySelector("#countryList");
const countrySearch = document.querySelector("#countrySearch");
const countryOptions = document.querySelector("#countryOptions");
let history = [];

function send(type, payload = {}) { return chrome.runtime.sendMessage({ type, ...payload }); }
function setStatus(text, error = false) { status.textContent = text; status.className = error ? "error" : ""; }

function downloadCsv(history) {
  const header = ["Email", "Department", "Style", "Domain", "Submission URL", "Generated at"];
  const rows = history.map((entry) => [entry.email, entry.department, entry.mode, entry.domain, entry.submissionUrl || "", entry.createdAt]);
  const csv = [header, ...rows].map((row) => row.map(WebPlover.csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url; link.download = "plover-filler-email-history.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

function renderHistory() {
  const term = search.value.trim().toLowerCase();
  const entries = term ? history.filter((entry) => Object.values(entry).join(" ").toLowerCase().includes(term)) : history;
  historySummary.textContent = `${entries.length} of ${history.length} generated emails`;
  historyList.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("li"); empty.className = "empty"; empty.textContent = history.length ? "No entries match your search." : "No generated emails yet."; historyList.append(empty); return;
  }
  entries.forEach((entry) => {
    const item = document.createElement("li"); item.className = "entry";
    const copy = document.createElement("div"); copy.className = "entry-copy";
    const email = document.createElement("p"); email.className = "email"; email.textContent = entry.email;
    const meta = document.createElement("p"); meta.className = "metadata"; meta.textContent = `${entry.department} · ${entry.mode} · ${formatDate(entry.createdAt)}`;
    const url = document.createElement("a"); url.className = "submission-url"; url.textContent = entry.submissionUrl || "Not filled"; if (entry.submissionUrl) { url.href = entry.submissionUrl; url.target = "_blank"; url.rel = "noopener noreferrer"; }
    copy.append(email, meta, url);
    const copyButton = document.createElement("button"); copyButton.type = "button"; copyButton.textContent = "Copy"; copyButton.addEventListener("click", async () => { await navigator.clipboard.writeText(entry.email); historySummary.textContent = `Copied ${entry.email}`; });
    const deleteButton = document.createElement("button"); deleteButton.type = "button"; deleteButton.textContent = "Delete"; deleteButton.className = "danger"; deleteButton.addEventListener("click", async () => { await send("DELETE_HISTORY", { id: entry.id }); history = history.filter((itemEntry) => itemEntry.id !== entry.id); renderHistory(); });
    item.append(copy, copyButton, deleteButton); historyList.append(item);
  });
}

function showTab() {
  const showHistory = location.hash === "#history";
  settingsPanel.hidden = showHistory; historyPanel.hidden = !showHistory;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.hash === (showHistory ? "#history" : "#settings")));
  if (showHistory) renderHistory();
}

async function initialize() {
  Object.entries(WebPlover.DEPARTMENTS).forEach(([value, label]) => fields.department.add(new Option(label, value)));
  Object.entries(WebPlover.MODES).forEach(([value, label]) => fields.mode.add(new Option(label, value)));
  Object.entries(WebPlover.COUNTRIES).forEach(([value, label]) => {
    fields.defaultCountry.add(new Option(label, value));
    const option = document.createElement("button"); option.type = "button"; option.role = "option"; option.textContent = label; option.dataset.search = `${value} ${label}`.toLowerCase();
    option.addEventListener("click", () => { fields.defaultCountry.value = value; countryButton.textContent = label; countryList.hidden = true; countryButton.setAttribute("aria-expanded", "false"); });
    countryOptions.append(option);
  });
  const response = await send("GET_STATE");
  if (!response.ok) throw new Error(response.message);
  const settings = response.state.settings;
  history = response.state.history;
  if (settings.theme !== "system") document.documentElement.dataset.theme = settings.theme;
  Object.entries(fields).forEach(([key, field]) => { field[key === "autoCopy" ? "checked" : "value"] = settings[key]; });
  countryButton.textContent = WebPlover.COUNTRIES[fields.defaultCountry.value];
  showTab();
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

document.querySelector("#resetCounters").addEventListener("click", async () => {
  if (!confirm("Reset all local department counters? Existing history will stay.")) return;
  await send("RESET_COUNTERS"); setStatus("Local department counters reset.");
});

countryButton.addEventListener("click", () => { const open = countryList.hidden; countryList.hidden = !open; countryButton.setAttribute("aria-expanded", String(open)); if (open) { countrySearch.value = ""; countryOptions.querySelectorAll("button").forEach((option) => { option.hidden = false; }); countrySearch.focus(); } });
countrySearch.addEventListener("input", () => { const term = countrySearch.value.trim().toLowerCase(); countryOptions.querySelectorAll("button").forEach((option) => { option.hidden = !option.dataset.search.includes(term); }); });
document.addEventListener("click", (event) => { if (!event.target.closest(".country-select")) { countryList.hidden = true; countryButton.setAttribute("aria-expanded", "false"); } });
search.addEventListener("input", renderHistory);
document.querySelector("#historyExport").addEventListener("click", () => downloadCsv(history));
document.querySelector("#historyClear").addEventListener("click", async () => {
  if (!confirm("Delete all locally stored email history? This cannot be undone.")) return;
  await send("CLEAR_HISTORY"); history = []; renderHistory();
});
window.addEventListener("hashchange", showTab);

initialize().catch((error) => setStatus(error.message, true));
