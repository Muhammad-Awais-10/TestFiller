(() => {
  const PROTECTED_HINT = /\b(password|passcode|login|log[ -]?in|sign[ -]?in|username|user[ -]?name|otp|one[ -]?time|verification|verify|captcha|card|credit|debit|cvv|cvc|iban|bank|routing|account number|tax|ssn|social security|passport|driver.?s? licen[cs]e|national id)\b/i;
  const PHONE_HINT = /\b(phone|telephone|mobile|cell|whats?app|fax|tel|contact[ _-]?(number|no|#)?|mobile[ _-]?(number|no|#)?|phone[ _-]?(number|no|#)?)\b/i;
  const COUNTRY_ALIASES = { US: ["us", "united states", "united states of america"], CA: ["ca", "canada"], GB: ["gb", "uk", "united kingdom", "great britain"], AU: ["au", "australia"] };
  const FIELD_RULES = {
    firstName: { autocomplete: ["given-name"], hint: /\b(first|given|forename)[ _-]?name\b/i },
    lastName: { autocomplete: ["family-name", "last-name"], hint: /\b(last|family|surname)[ _-]?name\b/i },
    fullName: { autocomplete: ["name"], hint: /\b(full[ _-]?name|your name|contact name|customer name|name)\b/i },
    email: { autocomplete: ["email"], hint: /\b(e-?mail|email address|your email|mail[ _-]?id)\b/i },
    phone: { autocomplete: ["tel", "tel-national", "tel-country-code"], hint: PHONE_HINT },
    company: { autocomplete: ["organization"], hint: /\b(company|organisation|organization|business)\b/i },
    address1: { autocomplete: ["address-line1", "street-address"], hint: /\b(address[ _-]?(line)?[ _-]?1|street address|street)\b/i },
    address2: { autocomplete: ["address-line2"], hint: /\b(address[ _-]?(line)?[ _-]?2|suite|unit|apartment|apt)\b/i },
    city: { autocomplete: ["address-level2"], hint: /\b(city|town)\b/i },
    stateRegion: { autocomplete: ["address-level1"], hint: /\b(state|province|region|county)\b/i },
    postalCode: { autocomplete: ["postal-code"], hint: /\b(zip|postal[ _-]?code|postcode)\b/i },
    country: { autocomplete: ["country", "country-name"], hint: /\bcountry\b/i },
    website: { autocomplete: ["url"], hint: /\b(website|web[ _-]?site|url|homepage)\b/i },
    jobTitle: { autocomplete: ["organization-title"], hint: /\b(job[ _-]?title|position|designation|profession|occupation)\b/i },
    message: { autocomplete: [], hint: /\b(message|comment|notes?|description|inquir(?:y|ies))\b/i }
  };
  const FILL_ORDER = ["country", "stateRegion", "firstName", "lastName", "fullName", "email", "phone", "company", "address1", "address2", "city", "postalCode", "website", "jobTitle", "message"];

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
    const nearby = [element.previousElementSibling, element.parentElement?.previousElementSibling, element.parentElement?.querySelector("label")]
      .filter(Boolean).map((item) => item.textContent).join(" ");
    return [element.name, element.id, element.className, element.placeholder, element.getAttribute("aria-label"), labelText(element), nearby].join(" ");
  }

  function eligible(element) {
    if (!element || element.disabled || element.readOnly || !visible(element)) return false;
    const type = (element.type || "").toLowerCase();
    return !["password", "hidden", "file", "submit", "button", "reset", "checkbox", "radio", "image", "date", "datetime-local", "time", "month", "week", "range", "color", "search"].includes(type) && !PROTECTED_HINT.test(hints(element));
  }

  function compatible(element, key) {
    const type = (element.type || "").toLowerCase();
    if (element instanceof HTMLInputElement && !["", "text", "email", "tel", "number", "url"].includes(type)) return false;
    if (type === "number") return key === "phone" || key === "postalCode";
    if (type === "email") return key === "email";
    if (type === "tel") return key === "phone";
    if (type === "url") return key === "website";
    return true;
  }

  function plainTextField(element) {
    const type = (element.type || "").toLowerCase();
    return (element instanceof HTMLTextAreaElement || (element instanceof HTMLInputElement && ["", "text"].includes(type)) || messageField(element)) && !PHONE_HINT.test(hints(element));
  }

  const filledValues = new WeakMap();

  function fieldValue(element) {
    return element.isContentEditable ? element.textContent : String(element.value || "");
  }

  function canFill(element) {
    return !fieldValue(element).trim() || filledValues.get(element) === fieldValue(element);
  }

  function allCandidates(root = document) {
    const candidates = Array.from(root.querySelectorAll("input, textarea, select, [contenteditable=\"true\"]"));
    if (root.querySelectorAll) {
      candidates.push(...Array.from(root.querySelectorAll("[role=radio], [role=checkbox], [role=listbox], [role=option], [role=button], [aria-haspopup=listbox], [aria-haspopup=menu], button, [tabindex]:not(input):not(textarea):not(select)")));
    }
    for (const host of root.querySelectorAll("*")) if (host.shadowRoot) candidates.push(...allCandidates(host.shadowRoot));
    return candidates;
  }

  function isHiddenLike(element) {
    return element.hidden || element.getAttribute("aria-hidden") === "true" || element.getAttribute("data-disabled") === "true" || !visible(element);
  }

  function roleText(element) {
    return [element.textContent, element.getAttribute("aria-label"), element.getAttribute("data-value")].filter(Boolean).join(" ");
  }

  function clickableTarget(element) {
    if (element instanceof HTMLElement && typeof element.click === "function") return element;
    return null;
  }

  function forbiddenAction(element) {
    const text = roleText(element).trim().toLowerCase();
    return /\b(next|back|submit|clear form|submit form|previous|continue)\b/.test(text);
  }

  function selectableLabel(element) {
    return [element.getAttribute("aria-label"), element.textContent, element.getAttribute("data-value")].filter(Boolean).join(" ").trim().toLowerCase();
  }

  function selectOptionByClick(option) {
    const target = clickableTarget(option);
    if (!target || isHiddenLike(target) || forbiddenAction(target)) return false;
    target.click();
    dispatchChange(target);
    return true;
  }

  function fillCustomSelectLike(element) {
    if (isHiddenLike(element) || forbiddenAction(element)) return false;
    const expanded = element.getAttribute("aria-expanded") === "true";
    const root = element.ownerDocument || document;
    const listboxId = element.getAttribute("aria-controls") || element.getAttribute("aria-owns");
    const menu = (listboxId && root.getElementById(listboxId)) || root.querySelector("[role=listbox][aria-hidden=\"false\"], [role=menu][aria-hidden=\"false\"]");
    if (!expanded && element.getAttribute("role") !== "option") {
      element.click();
      if (!menu) return true;
    }
    const options = Array.from((menu || root).querySelectorAll("[role=option], [role=menuitemradio], [role=menuitemcheckbox], [role=radio], [role=checkbox]"))
      .filter((option) => !isHiddenLike(option) && !option.closest("[aria-disabled=\"true\"], [disabled]") && !forbiddenAction(option));
    const chosen = options.find((option) => /\b(other|please select|choose|select)\b/.test(selectableLabel(option))) || options.find((option) => selectableLabel(option)) || null;
    return chosen ? selectOptionByClick(chosen) : false;
  }

  function questionRoot(element) {
    return element.closest("[role=radiogroup], [role=group], fieldset, .freebirdFormviewerViewItemsItemItem, .geS5n, .QoNYQd, .docssharedWizToggleLabeledContainer, .docssharedWizListboxRoot") || element.parentElement || element;
  }

  function groupKey(element) {
    const root = questionRoot(element);
    return [root.getAttribute("aria-label"), root.getAttribute("data-params"), root.textContent].filter(Boolean).join(" ").trim();
  }

  function randomChoice(items) {
    return items.length ? items[Math.floor(Math.random() * items.length)] : null;
  }

  function fillCustomControls(candidates) {
    const filled = [];
    const seen = new Set();
    const radios = candidates.filter((element) => (element.getAttribute && element.getAttribute("role")) === "radio" && !isHiddenLike(element) && !forbiddenAction(element) && canFill(element));
    const checks = candidates.filter((element) => (element.getAttribute && element.getAttribute("role")) === "checkbox" && !isHiddenLike(element) && !forbiddenAction(element) && canFill(element));
    const selects = candidates.filter((element) => ((element.getAttribute && element.getAttribute("role")) === "listbox" || (element.getAttribute && element.getAttribute("role")) === "button") && !isHiddenLike(element) && !forbiddenAction(element) && canFill(element));

    for (const element of radios) {
      const key = `radio:${groupKey(element)}`;
      if (seen.has(key)) continue;
      const groupRoot = questionRoot(element);
      const options = Array.from(groupRoot.querySelectorAll("[role=radio]")).filter((option) => !isHiddenLike(option) && !forbiddenAction(option) && !/\b(other)\b/.test(selectableLabel(option)));
      const chosen = randomChoice(options);
      if (chosen && selectOptionByClick(chosen)) { seen.add(key); filled.push("radio"); }
    }

    for (const element of checks) {
      const key = `checkbox:${groupKey(element)}`;
      if (seen.has(key)) continue;
      const groupRoot = questionRoot(element);
      const options = Array.from(groupRoot.querySelectorAll("[role=checkbox]")).filter((option) => !isHiddenLike(option) && !forbiddenAction(option) && !/\b(other)\b/.test(selectableLabel(option)));
      const picks = options.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(2, options.length || 0));
      let any = false;
      for (const option of picks) any = selectOptionByClick(option) || any;
      if (any) { seen.add(key); filled.push("checkbox"); }
    }

    for (const element of selects) {
      const key = `select:${groupKey(element)}`;
      if (seen.has(key)) continue;
      if (fillCustomSelectLike(element)) { seen.add(key); filled.push("dropdown"); }
    }
    return filled;
  }

  function activePopupCandidates() {
    const popups = Array.from(document.querySelectorAll(".pum-overlay, [role=dialog], [aria-modal=true]"))
      .filter(visible).sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0));
    return popups.length ? allCandidates(popups[0]) : allCandidates();
  }

  function messageField(element) {
    return element instanceof HTMLTextAreaElement || (element.isContentEditable && !(element instanceof HTMLInputElement || element instanceof HTMLSelectElement));
  }

  function score(element, rule, key) {
    if (!eligible(element) || !canFill(element) || !compatible(element, key)) return -1;
    if (rule === FIELD_RULES.message && !messageField(element)) return -1;
    const autocomplete = (element.getAttribute("autocomplete") || "").toLowerCase().trim().split(/\s+/).pop();
    if (rule.autocomplete.includes(autocomplete)) return 1000;
    const type = (element.type || "").toLowerCase();
    if (rule === FIELD_RULES.email && type === "email") return 900;
    if (rule === FIELD_RULES.phone && (type === "tel" || type === "number")) return 900;
    return rule.hint.test(hints(element)) ? 700 : -1;
  }

  function bestField(candidates, rule, claimed, key) {
    let best = null;
    let bestScore = -1;
    for (const element of candidates) {
      if (claimed.has(element)) continue;
      const nextScore = score(element, rule, key);
      if (nextScore > bestScore) { best = element; bestScore = nextScore; }
    }
    return best;
  }

  function knownField(element) {
    const autocomplete = (element.getAttribute("autocomplete") || "").toLowerCase().trim().split(/\s+/).pop();
    const type = (element.type || "").toLowerCase();
    return Object.entries(FIELD_RULES).some(([key, rule]) =>
      compatible(element, key) && (rule.autocomplete.includes(autocomplete) || rule.hint.test(hints(element)) ||
        (key === "email" && type === "email") || (key === "phone" && type === "tel") || (key === "website" && type === "url"))
    );
  }

  function optionValue(element, value, key) {
    const wanted = String(value).trim().toLowerCase();
    const aliases = key === "country" ? (COUNTRY_ALIASES[String(value).toUpperCase()] || [wanted])
      : key === "stateRegion" && wanted === "ca" ? ["ca", "california"] : [wanted];
    const option = Array.from(element.options).find((item) => aliases.includes(item.value.trim().toLowerCase()) || aliases.includes(item.text.trim().toLowerCase()));
    return option?.value || "";
  }

  function dispatchChange(element) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setValue(element, value, key) {
    const nextValue = element instanceof HTMLSelectElement ? optionValue(element, value, key) : value;
    if (!nextValue) return false;
    try {
      if (element.isContentEditable) element.textContent = nextValue;
      else {
        const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
        if (setter) setter.call(element, nextValue); else element.value = nextValue;
      }
    } catch { return false; }
    filledValues.set(element, fieldValue(element));
    dispatchChange(element);
    return true;
  }

  function optionLabel(option) {
    return `${option.text || ""} ${option.value || ""}`.trim().toLowerCase();
  }

  function isPlaceholderOption(option) {
    return !option.value || /^(select|choose|please select|--|\s*)$/i.test(optionLabel(option));
  }

  function fillSelectElement(element) {
    if (!canFill(element) || element.disabled || element.multiple || !(element instanceof HTMLSelectElement)) return false;
    const options = Array.from(element.options).filter((option) => !option.disabled && !isPlaceholderOption(option));
    const option = options.find((item) => item.selected) || options[0];
    if (!option) return false;
    return setValue(element, option.value, "message");
  }

  function fillMultiSelectElement(element) {
    if (!canFill(element) || element.disabled || !element.multiple || !(element instanceof HTMLSelectElement)) return false;
    const options = Array.from(element.options).filter((option) => !option.disabled && !isPlaceholderOption(option));
    if (!options.length) return false;
    const picks = options.slice(0, Math.min(2, options.length));
    for (const option of picks) option.selected = true;
    filledValues.set(element, fieldValue(element));
    dispatchChange(element);
    return true;
  }

  function fillCheckboxesAndRadios(candidates) {
    const filled = [];
    const radioGroups = new Set();
    for (const element of candidates) {
      if (!(element instanceof HTMLInputElement) || !eligible(element) || !canFill(element)) continue;
      const type = (element.type || "").toLowerCase();
      if (type === "checkbox" && !element.checked) {
        element.checked = true;
        filled.push("checkbox");
        dispatchChange(element);
      }
      if (type === "radio" && !element.checked) {
        const group = `${element.name || element.id || element.value || "radio"}`;
        if (radioGroups.has(group)) continue;
        element.checked = true;
        radioGroups.add(group);
        filled.push("radio");
        dispatchChange(element);
      }
    }
    return filled;
  }

  function fillContactProfile(profile) {
    const candidates = activePopupCandidates();
    const claimed = new Set();
    const filled = [];
    const hasSplitName = Boolean(bestField(candidates, FIELD_RULES.firstName, claimed, "firstName") || bestField(candidates, FIELD_RULES.lastName, claimed, "lastName"));
    for (const key of FILL_ORDER) {
      if (key === "fullName" && hasSplitName) continue;
      const value = key === "message" ? profile?.otherText || "Lorem ipsum dolor sit amet, consectetur adipiscing elit." : profile?.[key];
      const field = value && bestField(candidates, FIELD_RULES[key], claimed, key);
      if (field && setValue(field, value, key)) { claimed.add(field); filled.push(key); }
    }
    for (const field of candidates) {
      if (claimed.has(field) || !eligible(field) || !canFill(field) || !plainTextField(field) || knownField(field)) continue;
      if (setValue(field, profile?.otherText || "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", "message")) { claimed.add(field); filled.push("other"); }
    }
    for (const field of candidates) {
      if (field instanceof HTMLSelectElement && !claimed.has(field)) {
        if (fillSelectElement(field) || fillMultiSelectElement(field)) { claimed.add(field); filled.push(field.multiple ? "multi-select" : "select"); }
      }
    }
    const extraFilled = fillCheckboxesAndRadios(candidates);
    filled.push(...extraFilled, ...fillCustomControls(candidates));
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
