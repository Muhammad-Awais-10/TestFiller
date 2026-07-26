(() => {
  const PROTECTED_HINT = /\b(password|passcode|login|log[ -]?in|sign[ -]?in|username|user[ -]?name|otp|one[ -]?time|verification|verify|captcha|card|credit|debit|cvv|cvc|iban|bank|routing|account number|tax|ssn|social security|passport|driver.?s? licen[cs]e|national id)\b/i;
  const COUNTRY_ALIASES = { US: ["us", "united states", "united states of america"], CA: ["ca", "canada"], GB: ["gb", "uk", "united kingdom", "great britain"], AU: ["au", "australia"] };
  const FIELD_RULES = {
    firstName: { autocomplete: ["given-name"], hint: /\b(first|given)[ _-]?name\b/i },
    lastName: { autocomplete: ["family-name", "last-name"], hint: /\b(last|family|surname)[ _-]?name\b/i },
    fullName: { autocomplete: ["name"], hint: /\b(full[ _-]?name|your name|contact name|customer name)\b/i },
    email: { autocomplete: ["email"], hint: /\b(e-?mail|email address|your email)\b/i },
    phone: { autocomplete: ["tel", "tel-national", "tel-country-code"], hint: /\b(phone|telephone|mobile|cell)\b/i },
    company: { autocomplete: ["organization"], hint: /\b(company|organisation|organization|business)\b/i },
    address1: { autocomplete: ["address-line1", "street-address"], hint: /\b(address[ _-]?(line)?[ _-]?1|street address|street)\b/i },
    address2: { autocomplete: ["address-line2"], hint: /\b(address[ _-]?(line)?[ _-]?2|suite|unit|apartment|apt)\b/i },
    city: { autocomplete: ["address-level2"], hint: /\b(city|town)\b/i },
    stateRegion: { autocomplete: ["address-level1"], hint: /\b(state|province|region|county)\b/i },
    postalCode: { autocomplete: ["postal-code"], hint: /\b(zip|postal[ _-]?code|postcode)\b/i },
    country: { autocomplete: ["country", "country-name"], hint: /\bcountry\b/i }
  };
  const FILL_ORDER = ["country", "stateRegion", "firstName", "lastName", "fullName", "email", "phone", "company", "address1", "address2", "city", "postalCode"];

  function visible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function labelText(element) {
    const labels = element.labels ? Array.from(element.labels).map((label) => label.textContent) : [];
    return labels.join(" ");
  }

  function hints(element) {
    return [element.name, element.id, element.placeholder, element.getAttribute("aria-label"), labelText(element)].join(" ");
  }

  function eligible(element) {
    if (!element || element.disabled || element.readOnly || !visible(element)) return false;
    const type = (element.type || "").toLowerCase();
    return !["password", "hidden", "file", "submit", "button", "reset", "checkbox", "radio", "image", "date", "datetime-local", "time", "month", "week", "range", "color", "search"].includes(type) && !PROTECTED_HINT.test(hints(element));
  }

  function isEmpty(element) {
    return element.isContentEditable ? !element.textContent.trim() : !String(element.value || "").trim();
  }

  function allCandidates(root = document) {
    const candidates = Array.from(root.querySelectorAll("input, textarea, select, [contenteditable=\"true\"]"));
    for (const host of root.querySelectorAll("*")) if (host.shadowRoot) candidates.push(...allCandidates(host.shadowRoot));
    return candidates;
  }

  function score(element, rule) {
    if (!eligible(element) || !isEmpty(element)) return -1;
    const autocomplete = (element.getAttribute("autocomplete") || "").toLowerCase().trim().split(/\s+/).pop();
    if (rule.autocomplete.includes(autocomplete)) return 1000;
    if (rule === FIELD_RULES.email && (element.type || "").toLowerCase() === "email") return 900;
    return rule.hint.test(hints(element)) ? 700 : -1;
  }

  function bestField(candidates, rule, claimed) {
    let best = null;
    let bestScore = -1;
    for (const element of candidates) {
      if (claimed.has(element)) continue;
      let nextScore = score(element, rule);
      if (document.activeElement === element && nextScore >= 0) nextScore += 50;
      if (nextScore > bestScore) { best = element; bestScore = nextScore; }
    }
    return best;
  }

  function optionValue(element, value, key) {
    const wanted = String(value).trim().toLowerCase();
    const aliases = key === "country" ? (COUNTRY_ALIASES[String(value).toUpperCase()] || [wanted])
      : key === "stateRegion" && wanted === "ca" ? ["ca", "california"] : [wanted];
    const option = Array.from(element.options).find((item) => aliases.includes(item.value.trim().toLowerCase()) || aliases.includes(item.text.trim().toLowerCase()));
    return option?.value || "";
  }

  function setValue(element, value, key) {
    const nextValue = element instanceof HTMLSelectElement ? optionValue(element, value, key) : value;
    if (!nextValue) return false;
    if (element.isContentEditable) element.textContent = nextValue;
    else {
      const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      if (setter) setter.call(element, nextValue); else element.value = nextValue;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function fillContactProfile(profile) {
    const candidates = allCandidates();
    const claimed = new Set();
    const filled = [];
    const hasSplitName = Boolean(bestField(candidates, FIELD_RULES.firstName, claimed) || bestField(candidates, FIELD_RULES.lastName, claimed));
    for (const key of FILL_ORDER) {
      if (key === "fullName" && hasSplitName) continue;
      const value = profile?.[key];
      const field = value && bestField(candidates, FIELD_RULES[key], claimed);
      if (field && setValue(field, value, key)) { claimed.add(field); filled.push(key); }
    }
    return filled.length
      ? { ok: true, message: `Filled ${filled.length} safe contact field${filled.length === 1 ? "" : "s"}.`, filled }
      : { ok: false, message: "No empty safe contact fields were found on this page.", filled };
  }

  async function copyEmail(email) {
    try { await navigator.clipboard.writeText(email); return { ok: true, message: "Copied to clipboard." }; }
    catch { return { ok: false, message: "Copy failed. Select the email in the extension and copy it manually." }; }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "FILL_CONTACT_PROFILE") { sendResponse(fillContactProfile(message.profile)); return; }
    if (message.type === "COPY_EMAIL") { copyEmail(message.email).then(sendResponse); return true; }
  });
})();
