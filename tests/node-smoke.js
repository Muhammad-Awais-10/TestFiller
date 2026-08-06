const fs = require("fs");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const vm = require("vm");
const crypto = require("crypto").webcrypto;
const context = { crypto, URL };
context.globalThis = context;
vm.createContext(context);
["src/shared/constants.js", "src/shared/generator.js"].forEach((file) => vm.runInContext(fs.readFileSync(file, "utf8"), context));
const { WebPlover } = context;
const assert = (condition, label) => { if (!condition) throw new Error(label); };

(async () => {
  assert(!manifest.action.default_popup, "toolbar click does not open a popup");
  assert(WebPlover.buildEmail({ department: "qa", mode: "sequential", counter: 1, domain: "webplover.com" }) === "qa-000001@webplover.com", "sequential email");
  assert(WebPlover.buildEmail({ department: "dev", mode: "sequential", counter: 12, domain: "webplover.com" }) === "dev-000012@webplover.com", "department email");
  assert(WebPlover.buildEmail({ aliasPrefix: "sales", department: "qa", mode: "sequential", counter: 12, domain: "webplover.com" }) === "sales-000012@webplover.com", "custom alias prefix");
  assert(WebPlover.buildEmail({ department: "qa", mode: "website", counter: 12, domain: "webplover.com", pageUrl: "https://www.example.com/contact" }) === "example-qa-012@webplover.com", "website email");
  assert(WebPlover.buildEmail({ department: "qa", mode: "website", counter: 12, domain: "webplover.com", website: "client.example" }) === "client-qa-012@webplover.com", "configured website email");
  assert(WebPlover.normalizeWebsite("example.com") === "example.com", "website normalization");
  assert(WebPlover.normalizeCountry("ca") === "CA", "country normalization");
  assert(WebPlover.normalizeDomain("") === "example.com", "default domain");
  const profileA = WebPlover.contactProfile({ email: "qa-000001@webplover.com", allocationId: "allocation-1", country: "US" });
  const profileB = WebPlover.contactProfile({ email: "qa-000001@webplover.com", allocationId: "allocation-1", country: "US" });
  assert(JSON.stringify(profileA) === JSON.stringify(profileB), "deterministic profile");
  assert(profileA.email === "qa-000001@webplover.com" && /^[A-Za-z]+ [A-Za-z]+$/.test(profileA.fullName), "safe contact profile");
  assert(WebPlover.contactProfile({ email: "qa-000001@webplover.com", company: "Acme Ltd" }).company === "Acme Ltd", "custom company profile");
  assert(WebPlover.contactProfile({ email: "qa-000001@webplover.com", namePrefix: "Dr.", nameSuffix: "Jr." }).fullName.startsWith("Dr. ") && WebPlover.contactProfile({ email: "qa-000001@webplover.com", namePrefix: "Dr.", nameSuffix: "Jr." }).fullName.endsWith(" Jr."), "name prefix and suffix");
  const prefixedProfile = WebPlover.contactProfile({ email: "qa-000001@webplover.com", allocationId: "prefixed-profile", otherPrefix: "Hello", otherSuffix: "Thanks" });
  assert(prefixedProfile.otherText.startsWith("Hello ") && prefixedProfile.otherText.endsWith(". Thanks"), "other text prefix and suffix");
  const loremA = WebPlover.contactProfile({ email: "qa-000001@webplover.com", allocationId: "qa-1" }).otherText;
  const loremB = WebPlover.contactProfile({ email: "qa-000002@webplover.com", allocationId: "qa-2" }).otherText;
  assert(loremA !== loremB && loremA.split(" ").length >= 10 && loremB.split(" ").length <= 30, "varied lorem text");
  assert(/^\+1 555-\d{4}$/.test(profileA.phone), "fictional phone format");
  assert(WebPlover.contactProfile({ email: "qa-000002@webplover.com", allocationId: "allocation-ca", country: "CA" }).stateRegion === "ON", "Canadian profile");
  assert(WebPlover.contactProfile({ email: "qa-000003@webplover.com", allocationId: "allocation-gb", country: "GB" }).country === "GB", "UK profile");
  assert(/^\+92 3\d{9}$/.test(WebPlover.contactProfile({ email: "qa-000004@webplover.com", allocationId: "allocation-pk", country: "PK" }).phone), "Pakistani phone format");
  assert(/^\+91 [6-9]\d{9}$/.test(WebPlover.contactProfile({ email: "qa-000005@webplover.com", allocationId: "allocation-in", country: "IN" }).phone), "Indian phone format");
  assert(WebPlover.csvCell('a,"b"') === '"a,""b"""', "CSV escaping");

  class FakeInput {
    constructor(name, type = "text") { this.name = name; this.type = type; this.value = ""; this.labels = []; this.disabled = false; this.readOnly = false; }
    getAttribute(name) { return name === "autocomplete" ? "" : name === "aria-label" ? "" : null; }
    getBoundingClientRect() { return { width: 1, height: 1 }; }
    dispatchEvent() {}
  }
  class FakeTextArea extends FakeInput {}
  class FakeContentEditableInput extends FakeInput { constructor(name, type) { super(name, type); this.isContentEditable = true; this.textContent = ""; } }
  const firstNameField = new FakeInput("txtFirstName"); firstNameField.placeholder = "Your First Name";
  const lastNameField = new FakeInput("txtLastName"); lastNameField.placeholder = "Your Last Name";
  const mobileField = new FakeInput("txtMobile"); mobileField.placeholder = "Your Mobile";
  const emailField = new FakeInput("email", "email");
  const loremField = new FakeTextArea("message");
  const contentEditableDate = new FakeContentEditableInput("date", "date");
  const dateField = new FakeInput("full_name", "date");
  const unknownField = new FakeInput("custom_field");
  const fields = [firstNameField, lastNameField, mobileField, emailField, loremField, contentEditableDate, dateField, unknownField];
  let fillListener;
  const fillContext = {
    HTMLInputElement: FakeInput,
    HTMLTextAreaElement: FakeTextArea,
    HTMLSelectElement: class FakeSelect extends FakeInput {},
    Event: class Event { constructor(type) { this.type = type; } },
    getComputedStyle: () => ({ display: "block", visibility: "visible" }),
    document: { activeElement: null, querySelectorAll: (selector) => selector === "input, textarea, select, [contenteditable=\"true\"]" ? fields : [] },
    chrome: { runtime: { onMessage: { addListener: (listener) => { fillListener = listener; } } } }
  };
  class FakeButton {
    constructor(label, attrs = {}) { this.clicked = false; this.disabled = false; this.readOnly = false; this._attrs = attrs; this.textContent = label; this.ownerDocument = null; this.style = { zIndex: 0 }; }
    getAttribute(name) { return this._attrs[name] ?? null; }
    getBoundingClientRect() { return { width: 1, height: 1 }; }
  querySelectorAll() { return []; }
  closest() { return null; }
  click() { this.clicked = true; }

  }
  class FakeListbox extends FakeButton {
    querySelectorAll(selector) { return selector.includes("[role=option]") ? this.options : []; }
  closest() { return null; }
  }
  vm.createContext(fillContext);
  vm.runInContext(fs.readFileSync("src/content/content-script.js", "utf8"), fillContext);
  const fill = (profile) => { let result; fillListener({ type: "FILL_CONTACT_PROFILE", profile }, null, (response) => { result = response; }); return result; };
  const firstProfile = { ...WebPlover.contactProfile({ email: "first@example.com", allocationId: "first" }), otherText: "First lorem" };
  const secondProfile = { ...WebPlover.contactProfile({ email: "second@example.com", allocationId: "second" }), otherText: "Second lorem" };
  fill(firstProfile);
  fill(secondProfile);
  assert(firstNameField.value && lastNameField.value && mobileField.value.startsWith("+1 555-") && emailField.value === "second@example.com" && loremField.value === "Second lorem" && contentEditableDate.textContent === "" && dateField.value === "" && unknownField.value === "Second lorem", "classifies known fields before lorem fallback");
  emailField.value = "person@example.com";
  fill({ email: "third@example.com", otherText: "Third lorem" });
  assert(emailField.value === "person@example.com" && loremField.value === "Third lorem", "preserves user-edited fields");

  const normalButton = new FakeButton("Contact form owner", { role: "button" });
  const dropdownOption = new FakeButton("Choose one", { role: "option" });
  const dropdown = new FakeListbox("Select an option", { role: "button", "aria-haspopup": "listbox", "aria-controls": "dropdown-1" });
  const dropdownMenu = new FakeListbox("", { role: "listbox" });
  dropdown.ownerDocument = { getElementById: (id) => id === "dropdown-1" ? dropdownMenu : null };
  dropdownMenu.options = [dropdownOption];
  dropdownMenu.querySelectorAll = (selector) => selector.includes("[role=option]") ? dropdownMenu.options : [];
  dropdown.querySelectorAll = (selector) => selector.includes("[role=option]") ? dropdownMenu.options : [];
  let buttonClicked = false;
  normalButton.click = () => { buttonClicked = true; };
  const customCandidates = [normalButton, dropdown];
  const popupRoot = { style: { zIndex: 1 }, getBoundingClientRect: () => ({ width: 1, height: 1 }), querySelectorAll: (selector) => selector === "*" ? customCandidates : [] };
  const customContext = {
    HTMLInputElement: FakeInput,
    HTMLTextAreaElement: FakeTextArea,
    HTMLSelectElement: class FakeSelect extends FakeInput {},
    Event: class Event { constructor(type) { this.type = type; } },
    getComputedStyle: () => ({ display: "block", visibility: "visible" }),
    HTMLElement: FakeButton,
    document: { activeElement: null, querySelectorAll: (selector) => selector === "input, textarea, select, [contenteditable=\"true\"]" ? [] : (selector.includes("[role=dialog]") ? [popupRoot] : customCandidates) },
    chrome: { runtime: { onMessage: { addListener: (listener) => { customContext.listener = listener; } } } }
  };
  vm.createContext(customContext);
  vm.runInContext(fs.readFileSync("src/content/content-script.js", "utf8"), customContext);
  customContext.listener({ type: "FILL_CONTACT_PROFILE", profile: { otherText: "x" } }, null, () => {});
  assert(!buttonClicked, "does not click normal role=button controls");

  const backgroundSource = fs.readFileSync("src/background/service-worker.js", "utf8");
  const backgroundCalls = { sendMessage: [], executeScript: [] };
  const makeTab = (url = "https://example.com/form") => ({ id: 7, url });
  const runBackground = (overrides = {}) => {
    let listener;
    const chromeMock = {
      scripting: { executeScript: async (args) => { backgroundCalls.executeScript.push(args); if (overrides.executeScript) return overrides.executeScript(args); return {}; } },
      tabs: {
        query: async () => [overrides.tab || makeTab()],
        sendMessage: async (tabId, message) => { backgroundCalls.sendMessage.push({ tabId, message }); if (overrides.sendMessage) return overrides.sendMessage(tabId, message, backgroundCalls.sendMessage.length); return { ok: true, message: "filled" }; }
      },
      storage: { local: { get: async () => (overrides.get || {}), set: async () => {} } },
      contextMenus: { removeAll: (_, cb) => cb && cb(), create: () => {} },
      runtime: { onInstalled: { addListener: () => {} }, onStartup: { addListener: () => {} }, onMessage: { addListener: (fn) => { listener = fn; } }, openOptionsPage: () => {} },
      action: { onClicked: { addListener: () => {} } },
      commands: { onCommand: { addListener: () => {} } }
    };
    const ctx = { console, URL, crypto: { randomUUID: () => "id" }, chrome: chromeMock, globalThis: null };
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync("src/shared/constants.js", "utf8"), ctx);
    vm.runInContext(fs.readFileSync("src/shared/generator.js", "utf8"), ctx);
    vm.runInContext(fs.readFileSync("src/shared/storage.js", "utf8"), ctx);
    vm.runInContext(backgroundSource, ctx);
    return { listener };
  };

  let { listener: bgListener } = runBackground();
  let response;
  await bgListener({ type: "FILL_ACTIVE_TAB", email: "a@b.com" }, { tab: makeTab() }, (value) => { response = value; });
  assert(response.ok, "content script already available");
  assert(backgroundCalls.executeScript.length === 0, "does not inject when receiver exists");

  backgroundCalls.sendMessage = []; backgroundCalls.executeScript = [];
  ({ listener: bgListener } = runBackground({ sendMessage: async (_tabId, _message, callCount) => callCount === 1 ? Promise.reject(new Error("Could not establish connection. Receiving end does not exist.")) : { ok: true, message: "filled" }, executeScript: async () => ({}) }));
  await bgListener({ type: "FILL_ACTIVE_TAB", email: "a@b.com" }, { tab: makeTab() }, (value) => { response = value; });
  assert(response.ok, "no receiver, injection, then retry");
  assert(backgroundCalls.executeScript.length === 1, "injects once after missing receiver");
  assert(backgroundCalls.sendMessage.length === 2, "retries once after injection");

  ({ listener: bgListener } = runBackground({ sendMessage: async () => { throw new Error("Could not establish connection. Receiving end does not exist."); }, executeScript: async () => { throw new Error("Cannot access contents of url"); } }));
  await bgListener({ type: "FILL_ACTIVE_TAB", email: "a@b.com" }, { tab: { id: 7, url: "chrome://extensions" } }, (value) => { response = value; });
  assert(!response.ok, "restricted page injection fails");

  ({ listener: bgListener } = runBackground({ sendMessage: async () => { throw new Error("Could not establish connection. Receiving end does not exist."); }, executeScript: async () => ({}) }));
  await bgListener({ type: "FILL_ACTIVE_TAB", email: "a@b.com" }, { tab: makeTab() }, (value) => { response = value; });
  assert(!response.ok, "retry failure returns real failure");

  const duplicateGuard = { installed: 0 };
  const dupContext = {
    HTMLInputElement: FakeInput,
    HTMLTextAreaElement: FakeTextArea,
    HTMLSelectElement: class FakeSelect extends FakeInput {},
    Event: class Event { constructor(type) { this.type = type; } },
    getComputedStyle: () => ({ display: "block", visibility: "visible" }),
    document: { querySelectorAll: () => [] },
    chrome: { runtime: { onMessage: { addListener: (listener) => { duplicateGuard.installed += 1; duplicateGuard.listener = listener; } } } }
  };
  vm.createContext(dupContext);
  vm.runInContext(fs.readFileSync("src/content/content-script.js", "utf8"), dupContext);
  vm.runInContext(fs.readFileSync("src/content/content-script.js", "utf8"), dupContext);
  assert(duplicateGuard.installed === 1, "prevents duplicate listener registration");
  console.log("Generator and refill smoke checks passed.");
})().catch((error) => { console.error(error); process.exit(1); });
