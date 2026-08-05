globalThis.WebPlover = globalThis.WebPlover || {};

WebPlover.normalizeDomain = function (value) {
  const domain = String(value || "").trim().toLowerCase().replace(/^@/, "");
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)
    ? domain
    : WebPlover.DEFAULT_SETTINGS.domain;
};

WebPlover.normalizeCountry = function (value) {
  const country = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : WebPlover.DEFAULT_SETTINGS.defaultCountry;
};

WebPlover.normalizeAliasPrefix = function (value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
};

WebPlover.normalizeWebsite = function (value) {
  const website = String(value || "").trim();
  if (!website) return "";
  try { return new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
};

WebPlover.websiteToken = function (value) {
  const host = WebPlover.normalizeWebsite(value);
  return host.split(".")[0].replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
};

WebPlover.randomToken = function (length = 6) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
};

WebPlover.dateToken = function (date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

WebPlover.phoneNumber = function (country, index) {
  const countryCode = WebPlover.normalizeCountry(country);
  if (countryCode === "US" || countryCode === "CA") return `+1 555-${String((index % 9000) + 1000)}`;
  if (countryCode === "GB") return `+44 7700 ${String((index % 900000) + 100000)}`;
  if (countryCode === "AU") return `+61 4${String((index % 90000000) + 10000000)}`;
  const digits = String((index % 900000000) + 100000000);
  if (countryCode === "PK") return `+92 3${digits}`;
  if (countryCode === "IN") return `+91 ${6 + (index % 4)}${digits}`;
  const callingCode = WebPlover.COUNTRIES[countryCode]?.match(/\(\+(\d+)/)?.[1] || "1";
  return `+${callingCode} ${digits}`;
};

WebPlover.buildEmail = function ({ aliasPrefix, department, mode, counter, domain, pageUrl, website }) {
  const prefix = WebPlover.normalizeAliasPrefix(aliasPrefix) || (WebPlover.DEPARTMENTS[department] ? department : "other");
  const sequence = String(counter).padStart(6, "0");
  const websiteToken = WebPlover.websiteToken(website || pageUrl);
  const random = WebPlover.randomToken();
  let localPart;

  switch (mode) {
    case "random":
      localPart = `${prefix}-${random}`;
      break;
    case "date":
      localPart = `${prefix}-${WebPlover.dateToken()}-${sequence.slice(-3)}`;
      break;
    case "website":
      localPart = websiteToken ? `${websiteToken}-${prefix}-${sequence.slice(-3)}` : `${prefix}-${sequence}`;
      break;
    case "mixed":
      localPart = websiteToken ? `${websiteToken}-${prefix}-${WebPlover.dateToken()}-${random}` : `${prefix}-${WebPlover.dateToken()}-${random}`;
      break;
    default:
      localPart = `${prefix}-${sequence}`;
  }

  return `${localPart}@${WebPlover.normalizeDomain(domain)}`;
};

WebPlover.contactProfile = function ({ email, allocationId = email, country = "US", namePrefix = "", nameSuffix = "", otherPrefix = "", otherSuffix = "", company = "Example Company" }) {
  const index = Array.from(String(allocationId)).reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
  const firstNames = ["Avery", "Jordan", "Morgan", "Riley", "Taylor", "Casey", "Quinn", "Cameron"];
  const lastNames = ["Parker", "Reed", "Hayes", "Sutton", "Blake", "Rowan", "Ellis", "Brooks"];
  const countryCode = WebPlover.normalizeCountry(country);
  const locations = {
    US: { address1: `${(index % 899) + 100} Example Street`, address2: `Suite ${(index % 89) + 100}`, city: "Sample City", stateRegion: "CA", postalCode: String((index % 90000) + 10000) },
    CA: { address1: `${(index % 899) + 100} Example Street`, address2: `Unit ${(index % 89) + 100}`, city: "Sample City", stateRegion: "ON", postalCode: "K1A 0B1" },
    GB: { address1: `${(index % 899) + 100} Example Road`, address2: `Suite ${(index % 89) + 100}`, city: "Testford", stateRegion: "London", postalCode: "SW1A 1AA" },
    AU: { address1: `${(index % 899) + 100} Example Street`, address2: `Unit ${(index % 89) + 100}`, city: "Demo City", stateRegion: "NSW", postalCode: "2000" }
  };
  const location = { ...locations[countryCode] || locations.US, phone: WebPlover.phoneNumber(countryCode, index) };
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[(index >>> 3) % lastNames.length];
  const prefix = String(namePrefix || "").trim();
  const suffix = String(nameSuffix || "").trim();
  const loremWords = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");
  const loremLength = 10 + (index % 21);
  const lorem = Array.from({ length: loremLength }, (_, position) => loremWords[(index + position) % loremWords.length]).join(" ") + ".";

  return {
    firstName: [prefix, firstName].filter(Boolean).join(" "),
    lastName: [lastName, suffix].filter(Boolean).join(" "),
    fullName: [prefix, firstName, lastName, suffix].filter(Boolean).join(" "),
    email,
    company: String(company || "Example Company").trim(),
    website: "https://example.com",
    jobTitle: "Test Manager",
    otherText: [String(otherPrefix || "").trim(), lorem, String(otherSuffix || "").trim()].filter(Boolean).join(" "),
    country: countryCode,
    ...location
  };
};

WebPlover.csvCell = function (value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
