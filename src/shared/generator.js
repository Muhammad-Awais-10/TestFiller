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

WebPlover.websiteToken = function (url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const label = host.split(".")[0].replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return label.slice(0, 24);
  } catch {
    return "";
  }
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

WebPlover.buildEmail = function ({ department, mode, counter, domain, pageUrl }) {
  const prefix = WebPlover.DEPARTMENTS[department] ? department : "other";
  const sequence = String(counter).padStart(6, "0");
  const website = WebPlover.websiteToken(pageUrl);
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
      localPart = website ? `${website}-${prefix}-${sequence.slice(-3)}` : `${prefix}-${sequence}`;
      break;
    case "mixed":
      localPart = website ? `${website}-${prefix}-${WebPlover.dateToken()}-${random}` : `${prefix}-${WebPlover.dateToken()}-${random}`;
      break;
    default:
      localPart = `${prefix}-${sequence}`;
  }

  return `${localPart}@${WebPlover.normalizeDomain(domain)}`;
};

WebPlover.contactProfile = function ({ email, allocationId = email, country = "US" }) {
  const index = Array.from(String(allocationId)).reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
  const firstNames = ["Avery", "Jordan", "Morgan", "Riley", "Taylor", "Casey", "Quinn", "Cameron"];
  const lastNames = ["Parker", "Reed", "Hayes", "Sutton", "Blake", "Rowan", "Ellis", "Brooks"];
  const countryCode = WebPlover.normalizeCountry(country);
  const locations = {
    US: { phone: `+1 555-${String((index % 9000) + 1000)}`, address1: `${(index % 899) + 100} Example Street`, address2: `Suite ${(index % 89) + 100}`, city: "Sample City", stateRegion: "CA", postalCode: String((index % 90000) + 10000) },
    CA: { phone: `+1 555-${String((index % 9000) + 1000)}`, address1: `${(index % 899) + 100} Example Street`, address2: `Unit ${(index % 89) + 100}`, city: "Sample City", stateRegion: "ON", postalCode: "K1A 0B1" },
    GB: { phone: `+44 7700 ${String((index % 900000) + 100000)}`, address1: `${(index % 899) + 100} Example Road`, address2: `Suite ${(index % 89) + 100}`, city: "Testford", stateRegion: "London", postalCode: "SW1A 1AA" },
    AU: { phone: `+61 4${String((index % 90000000) + 10000000)}`, address1: `${(index % 899) + 100} Example Street`, address2: `Unit ${(index % 89) + 100}`, city: "Demo City", stateRegion: "NSW", postalCode: "2000" }
  };
  const location = locations[countryCode] || locations.US;
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[(index >>> 3) % lastNames.length];

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email,
    company: "Plover Test Company",
    country: countryCode,
    ...location
  };
};

WebPlover.csvCell = function (value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
