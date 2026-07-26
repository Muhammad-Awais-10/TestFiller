globalThis.WebPlover = globalThis.WebPlover || {};

WebPlover.DEPARTMENTS = {
  qa: "QA",
  dev: "Development",
  marketing: "Marketing",
  maintenance: "Maintenance",
  seo: "SEO",
  design: "Design",
  pm: "Project Management",
  sales: "Sales",
  support: "Support",
  other: "Other"
};

WebPlover.MODES = {
  sequential: "Sequential",
  random: "Random",
  date: "Date",
  website: "Website Name",
  mixed: "Mixed"
};

WebPlover.DEFAULT_SETTINGS = {
  website: "",
  domain: "webplover.com",
  aliasPrefix: "",
  department: "qa",
  mode: "sequential",
  autoCopy: true,
  includeWebsite: false,
  theme: "system",
  historyLimit: 500,
  defaultCountry: "US"
};

WebPlover.STORAGE_KEYS = {
  settings: "settings",
  counters: "counters",
  history: "history"
};

WebPlover.MAX_HISTORY = 500;
