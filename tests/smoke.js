const results = document.querySelector("#results");
const checks = [];
function check(name, condition) { if (!condition) throw new Error(`Failed: ${name}`); checks.push(`✓ ${name}`); }

try {
  check("normalizes valid domain", WebPlover.normalizeDomain("@Agency.com") === "agency.com");
  check("falls back from invalid domain", WebPlover.normalizeDomain("bad value") === "example.com");
  check("keeps sequential department prefix", WebPlover.buildEmail({ department: "qa", mode: "sequential", counter: 1, domain: "webplover.com" }) === "qa-000001@webplover.com");
  check("separates department sequences", WebPlover.buildEmail({ department: "dev", mode: "sequential", counter: 1, domain: "webplover.com" }) === "dev-000001@webplover.com");
  check("uses a custom alias prefix", WebPlover.buildEmail({ aliasPrefix: "sales", department: "qa", mode: "sequential", counter: 1, domain: "webplover.com" }) === "sales-000001@webplover.com");
  check("creates a date-mode local part", /^qa-\d{8}-001@webplover\.com$/.test(WebPlover.buildEmail({ department: "qa", mode: "date", counter: 1, domain: "webplover.com" })));
  check("creates a website-mode local part", WebPlover.buildEmail({ department: "qa", mode: "website", counter: 12, domain: "webplover.com", pageUrl: "https://www.example.com/contact" }) === "example-qa-012@webplover.com");
  const randomA = WebPlover.randomToken(); const randomB = WebPlover.randomToken();
  check("creates random token safely", /^[a-z2-9]{6}$/.test(randomA));
  check("does not repeat adjacent random token", randomA !== randomB);
  check("creates distinct local sequences", WebPlover.buildEmail({ department: "qa", mode: "sequential", counter: 2, domain: "webplover.com" }) === "qa-000002@webplover.com");
  const profile = WebPlover.contactProfile({ email: "qa-000001@webplover.com", allocationId: "smoke-allocation", country: "US" });
  check("creates deterministic safe contact profile", profile.email === "qa-000001@webplover.com" && /^[A-Za-z]+ [A-Za-z]+$/.test(profile.fullName));
  check("escapes CSV fields", WebPlover.csvCell('hello, "team"') === '"hello, ""team"""');
  results.textContent = `${checks.join("\n")}\n\nAll ${checks.length} smoke checks passed.`;
  results.style.color = "#18733c";
} catch (error) {
  results.textContent = `${checks.join("\n")}\n✗ ${error.message}`;
  results.style.color = "#b42318";
  throw error;
}
