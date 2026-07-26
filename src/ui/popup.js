const elements = {
  department: document.querySelector("#department"),
  mode: document.querySelector("#mode"),
  email: document.querySelector("#email"),
  generate: document.querySelector("#generate"),
  generateFill: document.querySelector("#generateFill"),
  copy: document.querySelector("#copy"),
  fill: document.querySelector("#fill"),
  status: document.querySelector("#status")
};
let currentEmail = "";
let settings = { ...WebPlover.DEFAULT_SETTINGS };

function message(type, text) {
  elements.status.className = `status ${type}`;
  elements.status.textContent = text;
}

function send(type, payload = {}) { return chrome.runtime.sendMessage({ type, ...payload }); }

function renderRecord(record) {
  currentEmail = record?.email || "";
  elements.email.textContent = currentEmail || "Generate an email to begin";
  elements.copy.disabled = !currentEmail;
}

async function persistSelectors() {
  settings = { ...settings, department: elements.department.value, mode: elements.mode.value };
  const response = await send("SAVE_SETTINGS", { settings });
  if (!response.ok) message("error", response.message);
  else settings = response.settings;
}

async function generate({ fill = false } = {}) {
  message("", fill ? "Generating a local email and filling safe fields…" : "Generating a local email…");
  const result = await send("GENERATE_FOR_ACTIVE_TAB", { options: { fill, copy: false } });
  if (!result.ok) return message("error", result.message);
  renderRecord(result.record);
  let copied = "";
  if (settings.autoCopy || fill) {
    try { await navigator.clipboard.writeText(result.record.email); copied = " Copied to clipboard."; }
    catch { copied = " Copy failed."; }
  }
  const filled = fill ? ` ${result.fillResult?.message || "Profile was not filled."}` : "";
  message(result.fillResult && !result.fillResult.ok ? "error" : "success", `Generated locally.${copied}${filled}`);
}

async function copy() {
  try { await navigator.clipboard.writeText(currentEmail); message("success", "Copied to clipboard."); }
  catch { message("error", "Copy failed. Select the email and copy it manually."); }
}

async function fill() {
  await generate({ fill: true });
}

async function initialize() {
  const response = await send("GET_STATE");
  if (!response.ok) return message("error", response.message);
  settings = response.state.settings;
  if (settings.theme !== "system") document.documentElement.dataset.theme = settings.theme;
  Object.entries(WebPlover.DEPARTMENTS).forEach(([value, label]) => elements.department.add(new Option(label, value)));
  Object.entries(WebPlover.MODES).forEach(([value, label]) => elements.mode.add(new Option(label, value)));
  elements.department.value = settings.department;
  elements.mode.value = settings.mode;
  renderRecord(response.state.history[0]);
  await generate({ fill: true });
}

elements.department.addEventListener("change", persistSelectors);
elements.mode.addEventListener("change", persistSelectors);
elements.generate.addEventListener("click", () => generate());
elements.generateFill.addEventListener("click", () => generate({ fill: true }));
elements.copy.addEventListener("click", copy);
elements.fill.addEventListener("click", fill);
initialize().catch((error) => message("error", error.message));
