import { useEffect, useMemo, useState } from "react";
import {
  Linkedin,
  Copy,
  Building,
  Mail,
  Zap,
  Phone,
  BadgeCheck,
  Clock,
  Flame,
  LogOut,
} from "lucide-react";

const BTN =
  "transition-all duration-150 hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]";

/* -------------------------------------------------------------------------- */
/*                               CORE UTILITIES                               */
/* -------------------------------------------------------------------------- */

function normalizeCompanySlug(name) {
  if (typeof name !== "string") return "";
  return name.toLowerCase().replace(/\s+/g, "");
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function buildStorageKey(user, suffix) {
  return user?.email
    ? `prospectai:${user.email}:${suffix}`
    : `prospectai:guest:${suffix}`;
}

async function copy(text) {
  const value = typeof text === "string" ? text : String(text ?? "");

  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const el = document.createElement("textarea");
    el.value = value;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

function runDevTests() {
  console.assert(normalizeCompanySlug("House Call Pro") === "housecallpro", "slug normalization failed");
  console.assert(normalizeCompanySlug(123) === "", "slug non-string safety failed");
  console.assert(safeJsonParse('{"a":1}', null)?.a === 1, "json parse failed");
}

/* -------------------------------------------------------------------------- */
/*                         ADVANCED DISCOVERY SERVICES                        */
/* -------------------------------------------------------------------------- */

async function googleCompanySearch(vertical) {
  try {
    const res = await fetch(`/api/google-saas-crawler?vertical=${encodeURIComponent(vertical)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function capterraSearch(vertical) {
  try {
    const res = await fetch(`/api/capterra-scraper?vertical=${encodeURIComponent(vertical)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function linkedinLeads(company) {
  try {
    const res = await fetch(`/api/linkedin-decision-makers?company=${encodeURIComponent(company)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function hunterVerify(name, company) {
  try {
    const res = await fetch(`/api/hunter-verify?name=${encodeURIComponent(name)}&company=${encodeURIComponent(company)}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return null;
  }
}

async function clearbitEnrich(domain) {
  try {
    if (!domain) return null;
    const cleanDomain = String(domain).replace(/^https?:\/\//, "").replace(/\/$/, "");
    const res = await fetch(`/api/clearbit-enrich?domain=${encodeURIComponent(cleanDomain)}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return null;
  }
}

async function detectSignals(company) {
  try {
    const res = await fetch(`/api/company-signals?company=${encodeURIComponent(company)}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return null;
  }
}

async function triggerDailyDiscovery(vertical = "service saas") {
  try {
    await fetch(`/api/daily-discovery?vertical=${encodeURIComponent(vertical)}`, {
      method: "POST",
    });
  } catch {
    /* silent noop */
  }
}

/* -------------------------------------------------------------------------- */
/*                               EMAIL BUILDER                                */
/* -------------------------------------------------------------------------- */

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildFallbackEmail(contact, company, senderCompany, newsHook, title) {
  const first = contact?.name?.split(" ")[0] || "there";
  const sender = senderCompany?.name || "our team";
  const pitch = senderCompany?.pitch || "embedded payments";
  const role = title || "your role";

  const openers = [
    `Saw ${company} gaining traction recently and wanted to reach out.`,
    `Was researching ${company} and a few things stood out.`,
    `Came across ${company} while digging into SaaS platforms in this space.`,
    `Noticed ${company} appears to be expanding product capabilities.`,
  ];

  const context = [
    `Given your role as ${role}, figured this might be relevant.`,
    `${role} leaders are usually the ones evaluating this.`,
    `Thought this might be relevant to your team.`,
  ];

  const pains = [
    "Many SaaS platforms eventually hit friction around payments and monetization.",
    "A lot of vertical SaaS teams start looking at embedding payments directly in their workflow.",
    "Operators usually want billing and collections native inside the product.",
  ];

  const values = [
    `${sender} helps SaaS platforms embed payments directly into the product experience.`,
    `${sender} works with product teams turning payments into a native workflow.`,
    `${sender} helps platforms simplify collections and unlock revenue from payments.`,
  ];

  const signalLines = [
    newsHook ? `Also noticed this signal: ${newsHook}.` : null,
    newsHook ? `${newsHook} made me think this could be timely.` : null,
    null,
  ].filter(Boolean);

  const maybeSignal = signalLines.length ? `\n\n${randomFrom(signalLines)}` : "";

  return `Hi ${first},

${randomFrom(openers)}

${randomFrom(context)}

${randomFrom(pains)}

${randomFrom(values)}${maybeSignal}

Worth comparing notes if ${pitch} is on your roadmap?`;
}

async function generateEmail(contact, company, senderCompany, signal) {
  try {
    const res = await fetch("/api/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName: contact?.name,
        contactTitle: contact?.title,
        contactBio: contact?.bio,
        company,
        senderCompany: senderCompany?.name,
        pitch: senderCompany?.pitch,
        signal,
      }),
    });

    if (!res.ok) throw new Error("AI email failed");

    const data = await res.json();
    if (typeof data?.email === "string" && data.email.trim()) return data.email;

    throw new Error();
  } catch {
    return buildFallbackEmail(contact, company, senderCompany, signal, contact?.title);
  }
}

/* -------------------------------------------------------------------------- */
/*                                  NAVBAR                                    */
/* -------------------------------------------------------------------------- */

function Navbar({ setPage, user }) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/70">
      <div className="flex items-center gap-2 font-semibold">
        <Flame className="text-emerald-400" />
        ProspectAI
      </div>

      <div className="flex gap-6 text-sm text-zinc-400 items-center">
        <button onClick={() => setPage("landing")} className="hover:text-white">
          Home
        </button>
        <button onClick={() => setPage("pricing")} className="hover:text-white">
          Pricing
        </button>
        {!user && (
          <button onClick={() => setPage("login")} className="hover:text-white">
            Login
          </button>
        )}
        {user && (
          <button onClick={() => setPage("dashboard")} className="hover:text-white">
            Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                LANDING PAGE                                */
/* -------------------------------------------------------------------------- */

function Landing({ setPage }) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [ticker, setTicker] = useState(47);

  const exampleCompanies = [
    {
      name: "ServiceTitan",
      vertical: "Field Service Software",
      score: 91,
      email:
        "Saw ServiceTitan expanding integrations for field contractors. Many platforms in this space are embedding payments to simplify collections inside the workflow. Worth exploring if that is something your team is evaluating?",
    },
    {
      name: "Jobber",
      vertical: "Home Services SaaS",
      score: 88,
      email:
        "Noticed Jobber has been investing heavily in workflow automation for service businesses. A lot of platforms in that space are embedding payments to remove friction during invoicing and collections. Curious if that is on your roadmap?",
    },
    {
      name: "Housecall Pro",
      vertical: "Contractor Software",
      score: 93,
      email:
        "Looks like Housecall Pro continues to grow in the contractor SaaS space. Many platforms serving trades are embedding payments directly into job workflows. Might be worth comparing notes if that is something your team is evaluating.",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setExampleIndex((i) => (i + 1) % exampleCompanies.length);
    }, 4000);

    const tickerTimer = setInterval(() => {
      setTicker((t) => t + Math.floor(Math.random() * 3));
    }, 3500);

    return () => {
      clearInterval(timer);
      clearInterval(tickerTimer);
    };
  }, []);

  const example = exampleCompanies[exampleIndex];

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-24 max-w-5xl mx-auto">
      <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
        AI Prospector
      </h1>

      <p className="text-zinc-300 text-lg max-w-2xl mb-10">
        Discover SaaS companies, identify decision makers, detect buying signals,
        and generate personalized outreach automatically.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => setPage("login")}
          className={`bg-emerald-500 px-6 py-3 rounded-lg text-sm font-semibold ${BTN}`}
        >
          Start Prospecting
        </button>

        <button
          onClick={() => setPage("pricing")}
          className={`bg-zinc-800 px-6 py-3 rounded-lg text-sm font-semibold ${BTN}`}
        >
          View Pricing
        </button>
      </div>

      <div className="mt-10 text-sm text-zinc-400">
        Returning User?{" "}
        <button
          onClick={() => setPage("login")}
          className="text-emerald-400 hover:text-emerald-300"
        >
          Login here
        </button>
      </div>

      <div className="mt-8 text-xs text-emerald-300">
        {ticker} companies discovered by users today
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-20 text-left w-full">
        <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Company Discovery</h3>
          <p className="text-sm text-zinc-400 mb-3">
            Crawl SaaS directories and discover companies that match your ICP.
          </p>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>• Vertical specific SaaS discovery</li>
            <li>• ICP score returned instantly</li>
            <li>• Buying signals surfaced</li>
          </ul>
        </div>

        <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Decision Maker Intelligence</h3>
          <p className="text-sm text-zinc-400 mb-3">
            Identify founders, product leaders and integration teams instantly.
          </p>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>• 3 to 5 contacts per company</li>
            <li>• LinkedIn profile links</li>
            <li>• Verified email confidence</li>
          </ul>
        </div>

        <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-2">AI Email Generation</h3>
          <p className="text-sm text-zinc-400 mb-3">
            Create personalized emails referencing company signals.
          </p>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>• Unique email per contact</li>
            <li>• Signal aware personalization</li>
            <li>• One click copy and send</li>
          </ul>
        </div>
      </div>

      <div className="mt-16 w-full max-w-4xl bg-zinc-900/70 border border-white/10 rounded-xl p-6 text-left">
        <h3 className="text-lg font-semibold mb-4">Example Prospect Discovery</h3>

        <div className="space-y-4">
          <div className="bg-black/60 border border-white/10 rounded-lg p-4">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold transition-all duration-500">{example.name}</div>
                <div className="text-xs text-zinc-400">{example.vertical}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-300">ICP Score</div>
                <div className="text-xl font-bold">{example.score}</div>
              </div>
            </div>

            <div className="h-2 rounded-full bg-black mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.95)] transition-all duration-700"
                style={{ width: `${example.score}%` }}
              />
            </div>

            <p className="text-sm text-zinc-400 mt-3">
              Vertical SaaS platform likely serving operators in this space.
              Strong ICP candidate based on product workflow and monetization model.
            </p>

            <div className="mt-4 bg-zinc-950 border border-white/10 rounded-lg p-3 text-sm text-zinc-300">
              <div className="text-xs text-emerald-300 mb-1">AI Email Example</div>
              {example.email}
            </div>

            <div className="text-[11px] text-zinc-500 mt-3">
              Example results rotate automatically to demonstrate discovery output.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 text-xs text-zinc-500">
        Live platform simulation • rotating example results • animated ICP scoring
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              AUTH / PRICING                                */
/* -------------------------------------------------------------------------- */

function AuthScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit() {
    if (!email.trim()) return;
    onLogin({ name: name.trim() || "User", email: email.trim() });
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-zinc-900 border border-white/10 rounded-xl p-8 space-y-4">
      <h2 className="text-2xl font-semibold">Login</h2>
      <p className="text-sm text-zinc-400">Access your prospecting workspace.</p>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3"
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3"
      />
      <button
        onClick={submit}
        className={`w-full bg-emerald-500 py-3 rounded-lg font-semibold ${BTN}`}
      >
        Continue
      </button>
    </div>
  );
}

function Pricing() {
  const [billing, setBilling] = useState("monthly");

  const plans = [
    {
      name: "Starter",
      monthly: "$39",
      yearly: "$29",
      credits: "500 credits",
      features: [
        "Company discovery",
        "Decision maker extraction",
        "AI email drafts",
      ],
    },
    {
      name: "Growth",
      monthly: "$99",
      yearly: "$79",
      credits: "2000 credits",
      features: [
        "Verified emails",
        "LinkedIn intelligence",
        "Signal detection",
      ],
    },
    {
      name: "Scale",
      monthly: "$249",
      yearly: "$199",
      credits: "10,000 credits",
      features: [
        "Daily prospect discovery",
        "Buying signals",
        "API access",
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-20 px-6 space-y-10">
      <h1 className="text-4xl font-bold text-center">Pricing</h1>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-4 py-2 rounded ${billing === "monthly" ? "bg-emerald-500" : "bg-zinc-800"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={`px-4 py-2 rounded ${billing === "yearly" ? "bg-emerald-500" : "bg-zinc-800"}`}
        >
          Annual
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((p) => (
          <div key={p.name} className="bg-zinc-900 border border-white/10 rounded-xl p-8 space-y-4">
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <div className="text-3xl font-bold">
              {billing === "monthly" ? p.monthly : p.yearly}
            </div>
            <div className="text-emerald-300 text-sm">{p.credits}</div>
            <ul className="text-sm text-zinc-400 space-y-2">
              {p.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <button className={`w-full bg-emerald-500 py-3 rounded-lg ${BTN}`}>
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               DISCOVERY ENGINE                             */
/* -------------------------------------------------------------------------- */

const demoCompanies = [
  "ServiceTitan",
  "Jobber",
  "Housecall Pro",
  "FieldEdge",
  "Workiz",
  "Kickserv",
  "Tradify",
  "Service Fusion",
  "Skedulo",
  "ServiceM8",
];

const demoTitles = ["CEO", "Founder", "Head of Partnerships", "VP Product", "CTO"];
const demoSignals = ["Hiring", "Payments", "Growth", "Funding", "Expansion"];

function generateDemoDecisionMakers(company) {
  return new Array(3).fill(0).map((_, i) => ({
    id: `${normalizeCompanySlug(company)}-${i}`,
    name: `${randomFrom(["Alex", "Jordan", "Taylor", "Chris", "Morgan"])} ${String.fromCharCode(
      65 + i
    )}.`,
    title: randomFrom(demoTitles),
    linkedin: `https://linkedin.com/in/${normalizeCompanySlug(company)}-${i}`,
    email: `${normalizeCompanySlug(company)}${i}@example.com`,
    phone: `(555) 22${i}-111${i}`,
    verified: true,
    confidence: 84 + i * 4,
    bio: "Leader involved in growth, partnerships, product, or revenue decisions.",
  }));
}

async function enrichDecisionMakers(company, leads) {
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return generateDemoDecisionMakers(company);
  }

  const enriched = [];

  for (const lead of leads.slice(0, 3)) {
    const emailData = await emailEnrich(lead.name, company);

    enriched.push({
      id: `${normalizeCompanySlug(company)}-${lead.name}`,
      name: lead.name,
      title: lead.title || randomFrom(demoTitles),
      linkedin:
        lead.linkedin ||
        `https://linkedin.com/search?q=${encodeURIComponent(`${lead.name} ${company}`)}`,
      email: emailData?.email || `${normalizeCompanySlug(company)}@example.com`,
      phone: emailData?.phone || "N/A",
      verified: !!emailData,
      confidence: emailData?.confidence || 75,
      bio: lead.bio || "Executive responsible for strategic or product initiatives.",
    });
  }

  return enriched;
}

async function discoverCompanies(vertical, amount = 3) {
  let companies = [];

  const google = await googleCompanySearch(vertical);
  const capterra = await capterraSearch(vertical);

  if (Array.isArray(google)) companies = companies.concat(google);
  if (Array.isArray(capterra)) companies = companies.concat(capterra);

  if (!companies.length) {
    companies = new Array(amount).fill(0).map(() => {
      const picked = randomFrom(demoCompanies);
      return {
        name: picked,
        website: `https://${normalizeCompanySlug(picked)}.com`,
      };
    });
  }

  const results = [];

  for (const company of companies.slice(0, amount)) {
    const leads = await linkedinLeads(company.name);
    const decisionMakers = await enrichDecisionMakers(company.name, leads);

    results.push({
      id: `${normalizeCompanySlug(company.name)}-${Date.now()}-${Math.random()}`,
      name: company.name,
      website: company.website || `https://${normalizeCompanySlug(company.name)}.com`,
      icpScore: Math.floor(Math.random() * 25) + 75,
      signal: randomFrom(demoSignals),
      description: `${company.name} appears to operate in the ${vertical || "service SaaS"} space and likely serves teams focused on workflow efficiency and monetization.`,
      decisionMakers,
    });
  }

  return results;
}

/* -------------------------------------------------------------------------- */
/*                              DASHBOARD PIECES                              */
/* -------------------------------------------------------------------------- */

function CompanyManager({ companies, setCompanies, selectedCompany, setSelectedCompany }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [pitch, setPitch] = useState("");

  function saveCompany() {
    if (!name.trim()) return;
    if (companies.length >= 3) {
      alert("You can save up to 3 companies.");
      return;
    }

    const next = { name: name.trim(), website, description, pitch };
    const updated = [...companies, next];
    setCompanies(updated);
    if (!selectedCompany) setSelectedCompany(next);
    setName("");
    setWebsite("");
    setDescription("");
    setPitch("");
  }

  return (
    <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold">My Companies</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Company Name"
        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2"
      />
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="Website"
        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What the company does"
        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2"
      />
      <textarea
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        placeholder="What you are selling"
        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2"
      />

      <button onClick={saveCompany} className={`w-full bg-emerald-500 py-2 rounded-lg ${BTN}`}>
        Save Company
      </button>

      <div className="space-y-2 pt-2">
        {companies.map((company) => (
          <button
            key={company.name}
            onClick={() => setSelectedCompany(company)}
            className={`w-full text-left rounded-lg px-3 py-2 border ${
              selectedCompany?.name === company.name
                ? "border-emerald-400 bg-zinc-800"
                : "border-white/10 bg-black"
            }`}
          >
            {company.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactCard({ contact, company, senderCompany, signal }) {
  const [emailDraft, setEmailDraft] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const draft = await generateEmail(contact, company, senderCompany, signal);
    setEmailDraft(draft);
    setLoading(false);
  }

  return (
    <div className="bg-black/60 border border-white/10 rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium flex items-center gap-2">
            {contact.name}
            {contact.verified && <BadgeCheck size={14} className="text-emerald-400" />}
          </div>
          <div className="text-xs text-zinc-400">{contact.title}</div>
        </div>

        <a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
          <Linkedin size={16} />
        </a>
      </div>

      <div className="text-xs flex items-center gap-2">
        <Mail size={12} /> {contact.email}
      </div>
      <div className="text-xs flex items-center gap-2">
        <Phone size={12} /> {contact.phone}
      </div>
      <div className="text-xs text-zinc-400">{contact.bio}</div>
      <div className="text-[11px] text-emerald-300">Email confidence: {contact.confidence}%</div>

      {!emailDraft && (
        <button onClick={handleGenerate} className={`bg-emerald-500 px-3 py-2 rounded text-xs ${BTN}`}>
          {loading ? "Generating..." : "Generate Email"}
        </button>
      )}

      {!!emailDraft && (
        <div className="space-y-2">
          <textarea
            readOnly
            value={emailDraft}
            className="w-full min-h-[150px] bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => copy(emailDraft)}
            className={`bg-emerald-600 px-3 py-2 rounded text-xs flex items-center gap-2 ${BTN}`}
          >
            <Copy size={12} /> Copy Email
          </button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ user, credits, setCredits, onLogout }) {
  const [vertical, setVertical] = useState("");
  const [companies, setCompanies] = useState(() =>
    safeJsonParse(localStorage.getItem(buildStorageKey(user, "companies")), [])
  );
  const [selectedCompany, setSelectedCompany] = useState(() =>
    safeJsonParse(localStorage.getItem(buildStorageKey(user, "selected-company")), null)
  );
  const [results, setResults] = useState(() =>
    safeJsonParse(localStorage.getItem(buildStorageKey(user, "results")), [])
  );
  const [history, setHistory] = useState(() =>
    safeJsonParse(localStorage.getItem(buildStorageKey(user, "history")), [])
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(buildStorageKey(user, "companies"), JSON.stringify(companies));
  }, [companies, user]);

  useEffect(() => {
    localStorage.setItem(buildStorageKey(user, "selected-company"), JSON.stringify(selectedCompany));
  }, [selectedCompany, user]);

  useEffect(() => {
    localStorage.setItem(buildStorageKey(user, "results"), JSON.stringify(results));
  }, [results, user]);

  useEffect(() => {
    localStorage.setItem(buildStorageKey(user, "history"), JSON.stringify(history));
  }, [history, user]);

  async function runScan(loadMore = false) {
    if (!selectedCompany) {
      alert("Select a company first.");
      return;
    }
    if (credits <= 0) {
      alert("You are out of credits.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));

    const discovered = await discoverCompanies(vertical || "service SaaS", 3);
    setResults((prev) => (loadMore ? [...prev, ...discovered] : discovered));
    setCredits((prev) => Math.max(prev - 1, 0));

    const entry = {
      time: new Date().toLocaleString(),
      vertical: vertical || "service SaaS",
      company: selectedCompany.name,
      count: discovered.length,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 10));
    setLoading(false);
  }

  const totalDecisionMakers = useMemo(
    () => results.reduce((sum, item) => sum + item.decisionMakers.length, 0),
    [results]
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prospecting Command Center</h1>
          <p className="text-zinc-400 text-sm mt-1">Welcome back, {user.name}.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-900/70 border border-white/10 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <Zap size={14} className="text-emerald-400" /> {credits} credits
          </div>
          <button onClick={onLogout} className={`bg-zinc-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${BTN}`}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-8">
        <div className="space-y-6">
          <CompanyManager
            companies={companies}
            setCompanies={setCompanies}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
          />

          <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold">Prospect Engine</h3>
            <input
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              placeholder="Enter SaaS vertical"
              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2"
            />
            <button onClick={() => runScan(false)} className={`w-full bg-emerald-500 py-2 rounded-lg ${BTN}`}>
              {loading ? "Scanning..." : "Start Scan (1 credit)"}
            </button>
            <button onClick={() => runScan(true)} className={`w-full bg-zinc-800 py-2 rounded-lg ${BTN}`}>
              Load More Companies
            </button>
          </div>

          <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock size={14} /> Scan History
            </h3>
            <div className="space-y-2 max-h-[240px] overflow-auto pr-1">
              {history.length === 0 && <div className="text-sm text-zinc-500">No scans yet.</div>}
              {history.map((item, idx) => (
                <div key={`${item.time}-${idx}`} className="bg-black/50 rounded-lg px-3 py-2 text-sm">
                  <div className="font-medium">
                    {item.company} → {item.vertical}
                  </div>
                  <div className="text-zinc-500 text-xs">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-4">
              <div className="text-zinc-400 text-xs">Companies Found</div>
              <div className="text-2xl font-bold mt-1">{results.length}</div>
            </div>
            <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-4">
              <div className="text-zinc-400 text-xs">Decision Makers</div>
              <div className="text-2xl font-bold mt-1">{totalDecisionMakers}</div>
            </div>
            <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-4">
              <div className="text-zinc-400 text-xs">Credits Remaining</div>
              <div className="text-2xl font-bold mt-1">{credits}</div>
            </div>
          </div>

          <div className="space-y-4">
            {results.length === 0 && (
              <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-8 text-zinc-400 text-center">
                Start a scan to discover companies and decision makers.
              </div>
            )}

            {results.map((result) => (
              <div key={result.id} className="bg-zinc-900/70 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-lg">
                      <Building size={16} /> {result.name}
                    </div>
                    <div className="text-sm text-zinc-400 mt-1">{result.website}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-300">ICP Score</div>
                    <div className="text-2xl font-bold">{result.icpScore}</div>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-black overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.95)] transition-all duration-700 ease-out"
                    style={{ width: `${result.icpScore}%` }}
                  />
                </div>

                <div className="text-sm text-zinc-300">{result.description}</div>

                <div className="flex flex-wrap gap-2">
                  {result.signal && (
                    <span className="bg-black/60 border border-white/10 rounded-full px-3 py-1 text-xs text-emerald-300">
                      {result.signal}
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {result.decisionMakers.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      company={result.name}
                      senderCompany={selectedCompany}
                      signal={result.signal}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   APP                                      */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [user, setUser] = useState(() =>
    safeJsonParse(localStorage.getItem("prospectai:user"), null)
  );
  const [credits, setCredits] = useState(() =>
    safeJsonParse(localStorage.getItem("prospectai:credits"), 100)
  );
  const [page, setPage] = useState("landing");

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes emeraldGradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("prospectai:user", JSON.stringify(user));
    } else {
      localStorage.removeItem("prospectai:user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("prospectai:credits", JSON.stringify(credits));
  }, [credits]);

  const backgroundClass =
    "min-h-screen bg-[linear-gradient(120deg,#000000,#022c22,#000000)] bg-[length:400%_400%] animate-[emeraldGradient_18s_ease_infinite] text-white";

  let content = null;

  if (page === "pricing") {
    content = <Pricing />;
  } else if (page === "login") {
    content = (
      <AuthScreen
        onLogin={(nextUser) => {
          setUser(nextUser);
          setPage("dashboard");
        }}
      />
    );
  } else if (page === "dashboard" && user) {
    content = (
      <Dashboard
        user={user}
        credits={credits}
        setCredits={setCredits}
        onLogout={() => {
          setUser(null);
          setPage("landing");
        }}
      />
    );
  } else {
    content = <Landing setPage={setPage} />;
  }

  return (
    <div className={backgroundClass}>
      <Navbar setPage={setPage} user={user} />
      {content}
    </div>
  );
}
