importScripts("../shared/constants.js", "../shared/generator.js", "../shared/storage.js");

let generationQueue = Promise.resolve();
const MENU_GENERATE_FILL = "plover-filler-generate-fill";
const MENU_SETTINGS = "plover-filler-settings";
const CONTENT_SCRIPT = "src/content/content-script.js";

function canInjectIntoTab(tab) {
  if (!tab?.url) return false;
  try {
    const url = new URL(tab.url);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isMissingReceiverError(error) {
  return /Receiving end does not exist|Could not establish connection|No receiving end/i.test(error?.message || "");
}

async function injectContentScript(tabId) {
  await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: [CONTENT_SCRIPT] });
}

async function sendToTab(tab, message) {
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    if (!isMissingReceiverError(error)) throw error;
    if (!canInjectIntoTab(tab)) return { ok: false, message: "This page does not support autofill." };
    try {
      await injectContentScript(tab.id);
      return await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      return { ok: false, message: "This page does not support autofill." };
    }
  }
}

async function generateEmail(pageUrl) {
  const { settings, counters, history } = await WebPlover.getState();
  const department = WebPlover.DEPARTMENTS[settings.department] ? settings.department : "qa";
  let counter = Number(counters[department]) || 0;
  const used = new Set(history.map((entry) => entry.email));
  let email;

  do {
    counter += 1;
    email = WebPlover.buildEmail({ ...settings, department, counter, pageUrl });
  } while (used.has(email) && counter < Number.MAX_SAFE_INTEGER);
  if (used.has(email)) throw new Error("Could not allocate a unique local test email. Reset counters only after clearing history.");

  counters[department] = counter;
  const profile = WebPlover.contactProfile({ email, allocationId: `${department}-${counter}`, country: settings.defaultCountry, namePrefix: settings.namePrefix, nameSuffix: settings.nameSuffix, otherPrefix: settings.otherPrefix, otherSuffix: settings.otherSuffix, company: settings.company, department });
  const record = {
    id: crypto.randomUUID(),
    email,
    profile,
    department,
    mode: settings.mode,
    domain: WebPlover.normalizeDomain(settings.domain),
    website: WebPlover.websiteToken(pageUrl),
    createdAt: new Date().toISOString()
  };
  await chrome.storage.local.set({ [WebPlover.STORAGE_KEYS.counters]: counters });
  await WebPlover.recordHistory(record, history, settings.historyLimit);
  return { record, settings };
}

function queuedGeneration(pageUrl) {
  const task = generationQueue.then(() => generateEmail(pageUrl));
  generationQueue = task.catch(() => undefined);
  return task;
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function fillAndRecord(tab, record) {
  if (!tab?.id) return null;
  const result = await sendToTab(tab, { type: "FILL_CONTACT_PROFILE", profile: record.profile });
  if (result.ok) await WebPlover.setSubmissionUrl(record.id, tab.url || "");
  return result;
}

async function generateForActiveTab({ fill = false, copy = false } = {}) {
  const tab = await currentTab();
  const result = await queuedGeneration(tab?.url || "");
  let fillResult = null;
  let copyResult = null;
  if (tab?.id) {
    [fillResult, copyResult] = await Promise.all([
      fill ? fillAndRecord(tab, result.record) : null,
      copy ? sendToTab(tab, { type: "COPY_EMAIL", email: result.record.email }) : null
    ]);
  }
  return { ...result, fillResult, copyResult };
}

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_GENERATE_FILL, title: "Generate and fill Plover Filler profile", contexts: ["editable"] });
    chrome.contextMenus.create({ id: MENU_SETTINGS, title: "Settings", contexts: ["action"] });
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const state = await WebPlover.getState();
  await WebPlover.saveSettings(state.settings);
  createContextMenu();
});
chrome.runtime.onStartup.addListener(createContextMenu);

chrome.action.onClicked.addListener(async () => {
  try {
    const result = await generateForActiveTab({ fill: true, copy: true });
    if (result.fillResult?.ok === false && !["This page does not support autofill.", "No empty safe contact fields were found on this page."].includes(result.fillResult.message)) console.error("Plover Filler toolbar action failed", result.fillResult.message);
  } catch (error) {
    console.error("Plover Filler toolbar action failed", error);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === MENU_SETTINGS) return chrome.runtime.openOptionsPage();
  if (info.menuItemId !== MENU_GENERATE_FILL || !tab?.id) return;
  try {
    const result = await queuedGeneration(tab.url || "");
    const [fillResult, copyResult] = await Promise.all([
      fillAndRecord(tab, result.record),
      sendToTab(tab, { type: "COPY_EMAIL", email: result.record.email })
    ]);
    if (fillResult?.ok === false && !["This page does not support autofill.", "No empty safe contact fields were found on this page."].includes(fillResult.message)) console.error("Plover Filler context menu action failed", fillResult.message);
    if (copyResult?.ok === false) console.error("Plover Filler context menu action failed", copyResult.message);
  } catch (error) {
    console.error("Plover Filler context menu action failed", error);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  try {
    const result = command === "generate-email"
      ? await generateForActiveTab({ copy: true })
      : command === "generate-and-fill"
        ? await generateForActiveTab({ fill: true, copy: true })
        : null;
    if (result?.fillResult?.ok === false && !["This page does not support autofill.", "No empty safe contact fields were found on this page."].includes(result.fillResult.message)) console.error("Plover Filler command failed", result.fillResult.message);
    if (result?.copyResult?.ok === false) console.error("Plover Filler command failed", result.copyResult.message);
  } catch (error) {
    console.error("Plover Filler command failed", error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "GET_STATE":
        sendResponse({ ok: true, state: await WebPlover.getState() });
        return;
      case "SAVE_SETTINGS":
        sendResponse({ ok: true, settings: await WebPlover.saveSettings(message.settings) });
        return;
      case "GENERATE":
        sendResponse({ ok: true, ...(await queuedGeneration(message.pageUrl || sender.tab?.url || "")) });
        return;
      case "GENERATE_FOR_ACTIVE_TAB":
        sendResponse({ ok: true, ...(await generateForActiveTab(message.options)) });
        return;
      case "FILL_ACTIVE_TAB": {
        const tab = await currentTab();
        if (!tab?.id) return sendResponse({ ok: false, message: "No active tab is available to fill." });
        const { settings } = await WebPlover.getState();
        const profile = message.profile || WebPlover.contactProfile({ email: message.email, allocationId: message.email, company: settings.company });
        const result = await sendToTab(tab, { type: "FILL_CONTACT_PROFILE", profile });
        if (result.ok && message.id) await WebPlover.setSubmissionUrl(message.id, tab.url || "");
        sendResponse(result);
        return;
      }
      case "DELETE_HISTORY":
        await WebPlover.deleteHistory(message.id);
        sendResponse({ ok: true });
        return;
      case "CLEAR_HISTORY":
        await WebPlover.clearHistory();
        sendResponse({ ok: true });
        return;
      case "RESET_COUNTERS":
        await WebPlover.resetCounters();
        sendResponse({ ok: true });
        return;
      default:
        sendResponse({ ok: false, message: "Unknown Plover Filler request." });
    }
  })().catch((error) => sendResponse({ ok: false, message: error.message || "Something went wrong." }));
  return true;
});
