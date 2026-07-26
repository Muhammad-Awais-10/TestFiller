globalThis.WebPlover = globalThis.WebPlover || {};

WebPlover.getState = async function () {
  const keys = WebPlover.STORAGE_KEYS;
  const stored = await chrome.storage.local.get([keys.settings, keys.counters, keys.history]);
  return {
    settings: { ...WebPlover.DEFAULT_SETTINGS, ...(stored[keys.settings] || {}) },
    counters: stored[keys.counters] || {},
    history: Array.isArray(stored[keys.history]) ? stored[keys.history] : []
  };
};

WebPlover.saveSettings = async function (settings) {
  const normalized = {
    ...WebPlover.DEFAULT_SETTINGS,
    ...settings,
    domain: WebPlover.normalizeDomain(settings.domain),
    department: WebPlover.DEPARTMENTS[settings.department] ? settings.department : WebPlover.DEFAULT_SETTINGS.department,
    mode: WebPlover.MODES[settings.mode] ? settings.mode : WebPlover.DEFAULT_SETTINGS.mode,
    defaultCountry: WebPlover.normalizeCountry(settings.defaultCountry),
    historyLimit: Math.max(1, Math.min(WebPlover.MAX_HISTORY, Number(settings.historyLimit) || WebPlover.MAX_HISTORY))
  };
  await chrome.storage.local.set({ [WebPlover.STORAGE_KEYS.settings]: normalized });
  return normalized;
};

WebPlover.recordHistory = async function (record, history, limit) {
  const nextHistory = [record, ...history].slice(0, limit);
  await chrome.storage.local.set({ [WebPlover.STORAGE_KEYS.history]: nextHistory });
  return nextHistory;
};

WebPlover.clearHistory = function () {
  return chrome.storage.local.set({ [WebPlover.STORAGE_KEYS.history]: [] });
};

WebPlover.deleteHistory = async function (id) {
  const keys = WebPlover.STORAGE_KEYS;
  const stored = await chrome.storage.local.get(keys.history);
  const history = Array.isArray(stored[keys.history]) ? stored[keys.history] : [];
  await chrome.storage.local.set({ [keys.history]: history.filter((entry) => entry.id !== id) });
};

WebPlover.resetCounters = function () {
  return chrome.storage.local.set({ [WebPlover.STORAGE_KEYS.counters]: {} });
};
