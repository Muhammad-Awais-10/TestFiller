const list = document.querySelector("#history");
const search = document.querySelector("#search");
const summary = document.querySelector("#summary");
let history = [];

function send(type, payload = {}) { return chrome.runtime.sendMessage({ type, ...payload }); }
function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

function filteredHistory() {
  const term = search.value.trim().toLowerCase();
  return term ? history.filter((entry) => Object.values(entry).join(" ").toLowerCase().includes(term)) : history;
}

function render() {
  const entries = filteredHistory();
  summary.textContent = `${entries.length} of ${history.length} generated emails`;
  list.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("li"); empty.className = "empty"; empty.textContent = history.length ? "No entries match your search." : "No generated emails yet."; list.append(empty); return;
  }
  entries.forEach((entry) => {
    const item = document.createElement("li"); item.className = "entry";
    const copy = document.createElement("div"); copy.className = "entry-copy";
    const email = document.createElement("p"); email.className = "email"; email.textContent = entry.email;
    const meta = document.createElement("p"); meta.className = "metadata"; meta.textContent = `${entry.department} · ${entry.mode} · ${formatDate(entry.createdAt)}`;
    const website = document.createElement("a"); website.className = "website"; website.href = entry.submissionUrl || "#"; website.textContent = entry.submissionUrl || "Not filled"; if (entry.submissionUrl) { website.target = "_blank"; website.rel = "noopener noreferrer"; } else website.removeAttribute("href");
    copy.append(email, meta, website);
    const copyButton = document.createElement("button"); copyButton.textContent = "Copy"; copyButton.addEventListener("click", async () => { await navigator.clipboard.writeText(entry.email); summary.textContent = `Copied ${entry.email}`; });
    const deleteButton = document.createElement("button"); deleteButton.textContent = "Delete"; deleteButton.className = "danger"; deleteButton.addEventListener("click", async () => { await send("DELETE_HISTORY", { id: entry.id }); history = history.filter((itemEntry) => itemEntry.id !== entry.id); render(); });
    item.append(copy, copyButton, deleteButton); list.append(item);
  });
}

function exportCsv() {
  const rows = [["Email", "Department", "Style", "Domain", "Submission URL", "Generated at"], ...history.map((entry) => [entry.email, entry.department, entry.mode, entry.domain, entry.submissionUrl || "", entry.createdAt])];
  const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(WebPlover.csvCell).join(",")).join("\r\n")], { type: "text/csv" }));
  const link = document.createElement("a"); link.href = url; link.download = "webplover-test-email-history.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
}

search.addEventListener("input", render);
document.querySelector("#export").addEventListener("click", exportCsv);
document.querySelector("#clear").addEventListener("click", async () => { if (!confirm("Delete all locally stored email history? This cannot be undone.")) return; await send("CLEAR_HISTORY"); history = []; render(); });
send("GET_STATE").then((response) => { if (!response.ok) { summary.textContent = response.message; return; } if (response.state.settings.theme !== "system") document.documentElement.dataset.theme = response.state.settings.theme; history = response.state.history; render(); }).catch((error) => { summary.textContent = error.message; });
