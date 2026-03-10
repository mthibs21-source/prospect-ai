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
  User,
  CreditCard,
  LogOut,
} from "lucide-react";

const BTN =
  "transition-all duration-150 hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]";

// Backend discovery is preferred. This pool is only used if the API is unavailable.
const crawlerPool = [
  "FieldPulse",
  "ServiceTitan",
  "Housecall Pro",
  "Jobber",
  "Service Fusion",
  "Kickserv",
  "WorkWave",
  "RazorSync",
  "mHelpDesk",
  "Buildertrend",
  "Tradify",
  "SimPro",
  "ServiceM8",
  "FieldEdge",
  "Vonigo",
  "ZenMaid",
  "ServiceBridge",
  "FieldRoutes",
  "BlueFolder",
  "Service Autopilot",
  "ServiceMonster",
  "Smart Service",
  "Thryv",
  "ServiceTrade",
  "FIELDBOSS",
  "Commusoft",
  "ServiceWorks",
  "Loc8",
  "AroFlo",
  "Joblogic",
];

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
  return user?.email ? `prospectai:${user.email}:${suffix}` : `prospectai:guest:${suffix}`;
}

function buildFallbackEmail(contact, company, senderCompany, newsHook, title, bio) {
  const safeName = typeof contact?.name === "string" ? contact.name : "there";
  const first = safeName.split(" ")[0] || "there";
  const senderName = senderCompany?.name || "our team";
  const pitch = senderCompany?.pitch || "embedded payments";
  const role = title || "your role";
  const safeNews = typeof newsHook === "string" && newsHook.trim() ? newsHook : "growing in the market";

  const openers = [
    `Saw that ${company} is ${safeNews}.`,
    `Noticed ${company} has been ${safeNews}.`,
    `Looks like ${company} is ${safeNews}.`,
  ];

  const pains = [
    `A lot of vertical SaaS platforms run into friction around payments and monetization as they scale.`,
    `Teams building contractor software often hit limits with billing, collections, and embedded finance.`,
    `Many platforms in this category eventually need tighter payment workflows built directly into the product.`
  ];

  const value = [
    `${senderName} helps platforms embed payments directly into their workflow.`,
    `We've been helping SaaS teams add native payment infrastructure inside their product.`,
    `Our team works with SaaS companies that want payments to become part of their core product experience.`
  ];

  const opener = openers[Math.floor(Math.random() * openers.length)];
  const pain = pains[Math.floor(Math.random() * pains.length)];
  const val = value[Math.floor(Math.random() * value.length)];

  return `Hi ${first},

${opener} Given your role as ${role}, figured this might be relevant.

${pain}

${val} Particularly for teams serving operators like the ones ${company} supports.

Worth a quick conversation if you're exploring ${pitch} right now?`;
}

function generateCompanyFromApi(data, vertical, senderCompany) {
  const companyName = data?.company || "Unknown Company";
  const slug = normalizeCompanySlug(companyName) || "company";
  const pitchHint = senderCompany?.pitch || "embedded payments";

  return {
    id: `${slug}-${Math.random().toString(36).slice(2, 7)}`,
    company: companyName,
    score: typeof data?.score === "number" ? data.score : 80,
    location: data?.location || "Unknown",
    news: data?.signal || data?.news || "recent growth",
    description:
      data?.description || `${companyName} operates in the ${vertical || "service SaaS"} space.`,
    aiInsight:
      data?.aiInsight ||
      `This company likely benefits from ${pitchHint} because it serves operators that need monetization and payment workflows.`,
    contacts: Array.isArray(data?.contacts)
      ? data.contacts.map((c, i) => ({
          id: `${slug}-${i}`,
          name: c?.name || "Unknown Contact",
          title: c?.title || "Decision Maker",
          email: typeof c?.email === "string" ? c.email : "",
          phone: typeof c?.phone === "string" ? c.phone : "",
          linkedin: typeof c?.linkedin === "string" ? c.linkedin : "",
          verified: !!c?.verified,
          confidence: typeof c?.confidence === "number" ? c.confidence : 80,
          bio: c?.bio || "SaaS leader involved in product or revenue decisions.",
        }))
      : [],
  };
}

function generateCompanyFallback(index, vertical, senderCompany) {
  const companyName = crawlerPool[index % crawlerPool.length];
  const slug = normalizeCompanySlug(companyName);
  const pitchHint = senderCompany?.pitch || "embedded payments";
  const newsPool = [
    "recently raised funding",
    "launching new integrations",
    "expanding into new markets",
    "hiring aggressively for product roles",
    "rolling out new billing workflows",
  ];
  const news = newsPool[index % newsPool.length];

  return {
    id: `${slug}-${index}`,
    company: companyName,
    score: 80 + (index % 15),
    location: "United States",
    news,
    description: `${companyName} is a ${vertical || "service SaaS"} platform helping businesses manage scheduling, dispatch and invoicing.`,
    aiInsight: `This company likely benefits from ${pitchHint} because it serves operators who need faster collections and better workflow automation.`,
    contacts: [
      {
        id: `${slug}-ceo`,
        name: "Alex Carter",
        title: "CEO",
        email: `alex@${slug}.com`,
        phone: "(555) 222-1111",
        linkedin: "https://linkedin.com",
        verified: true,
        confidence: 92,
        bio: "Founder focused on scaling vertical SaaS platforms for contractors.",
      },
      {
        id: `${slug}-vp-product`,
        name: "Jordan Lee",
        title: "VP Product",
        email: `jordan@${slug}.com`,
        phone: "(555) 333-1111",
        linkedin: "https://linkedin.com",
        verified: true,
        confidence: 88,
        bio: "Product executive focused on fintech integrations.",
      },
      {
        id: `${slug}-partnerships`,
        name: "Taylor Smith",
        title: "Head of Partnerships",
        email: `taylor@${slug}.com`,
        phone: "(555) 444-1111",
        linkedin: "https://linkedin.com",
        verified: true,
        confidence: 85,
        bio: "Leads SaaS partnerships and integration ecosystems.",
      },
    ],
  };
}

async function generateEmail(contact, company, senderCompany, newsHook) {
  try {
    const res = await fetch("/api/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName: contact?.name,
        contactTitle: contact?.title,
        contactBio: contact?.bio,
        company,
        pitch: senderCompany?.pitch,
        senderCompany: senderCompany?.name,
        news: newsHook,
      }),
    });

    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    if (typeof data?.email === "string" && data.email.trim()) {
      return data.email;
    }

    throw new Error("Invalid email response");
  } catch {
    return buildFallbackEmail(
      contact,
      company,
      senderCompany,
      newsHook,
      contact?.title,
      contact?.bio
    );
  }
}

async function copy(text) {
  const safeText = typeof text === "string" ? text : String(text ?? "");

  try {
    await navigator.clipboard.writeText(safeText);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = safeText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function downloadCsv(filename, rows) {
  const csv = `Company,Score,Location\n${rows.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function runDevTests() {
  console.assert(
    normalizeCompanySlug("Housecall Pro") === "housecallpro",
    "normalizeCompanySlug should remove spaces and lowercase"
  );
  console.assert(
    normalizeCompanySlug(null) === "",
    "normalizeCompanySlug should safely handle non-string input"
  );

  const syncFallbackEmail = buildFallbackEmail(
    { name: "Alex Carter" },
    "FieldPulse",
    { name: "North", pitch: "embedded payments" },
    "recently raised funding"
  );
  console.assert(
    typeof syncFallbackEmail === "string" && syncFallbackEmail.includes("Hi Alex,"),
    "fallback email should be a string and personalize first name"
  );
  console.assert(
    syncFallbackEmail.includes("North"),
    "fallback email should include the sender company"
  );

  const asyncEmail = await generateEmail(
    { name: "Alex Carter" },
    "FieldPulse",
    { name: "North", pitch: "embedded payments" },
    "recently raised funding"
  );
  console.assert(typeof asyncEmail === "string", "generateEmail should resolve to a string");

  const csvRows = ["A,90,USA", "B,80,USA"];
  const csv = `Company,Score,Location\n${csvRows.join("\n")}`;
  console.assert(csv.includes("A,90,USA"), "csv should contain rows");

  const company = generateCompanyFallback(0, "field service software", { pitch: "payments" });
  console.assert(company.contacts.length === 3, "fallback generator should return 3 contacts");
  console.assert(company.news.length > 0, "fallback generator should include news");
  console.assert(
    typeof company.contacts[0].confidence === "number",
    "contacts should include a numeric confidence score"
  );
}

function Navbar({ setPage }) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/70">
      <div className="flex items-center gap-2 font-semibold">
        <Flame className="text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
        ProspectAI
      </div>

      <div className="flex gap-6 text-sm text-zinc-400">
        <button onClick={() => setPage("dashboard")} className="hover:text-white">
          Dashboard
        </button>
        <button onClick={() => setPage("pricing")} className="hover:text-white">
          Pricing
        </button>
        <button onClick={() => setPage("profile")} className="hover:text-white">
          Profile
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  function submit() {
    if (!form.email) return;
    onAuth({
      name: form.name || "New User",
      email: form.email,
      phone: form.phone,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="text-2xl font-semibold">{mode === "login" ? "Login" : "Create Account"}</div>

        {mode === "signup" && (
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-black border border-white/10 p-3 rounded"
          />
        )}

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-black border border-white/10 p-3 rounded"
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-black border border-white/10 p-3 rounded"
        />

        <button onClick={submit} className={`w-full bg-emerald-500 py-3 rounded ${BTN}`}>
          {mode === "login" ? "Login" : "Sign Up"}
        </button>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm text-zinc-400 hover:text-white"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

function Pricing() {
  const [billing, setBilling] = useState("monthly");

  const plans =
    billing === "monthly"
      ? [
          { name: "Free", price: "$0", credits: "10 daily credits" },
          { name: "Starter", price: "$49", credits: "100 monthly credits" },
          { name: "Pro", price: "$149", credits: "500 monthly credits" },
        ]
      : [
          { name: "Free", price: "$0", credits: "10 daily credits" },
          { name: "Starter", price: "$39", credits: "100 monthly credits, billed annually" },
          { name: "Pro", price: "$119", credits: "500 monthly credits, billed annually" },
        ];

  return (
    <div className="p-10 space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-4 py-2 rounded ${billing === "monthly" ? "bg-emerald-500" : "bg-zinc-800"} ${BTN}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`px-4 py-2 rounded ${billing === "annual" ? "bg-emerald-500" : "bg-zinc-800"} ${BTN}`}
        >
          Annual
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:border-emerald-500/40 transition rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold mb-2">{plan.price}</div>
            <p className="text-zinc-400 text-sm mb-4">{plan.credits}</p>
            <button className={`w-full bg-emerald-500 py-2 rounded ${BTN}`}>Choose Plan</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Profile({ user, credits, setCredits, onLogout }) {
  const [form, setForm] = useState(user);

  useEffect(() => {
    setForm(user);
  }, [user]);

  return (
    <div className="p-10 max-w-xl space-y-6">
      <h2 className="text-2xl font-semibold">User Profile</h2>

      <div className="bg-zinc-900/70 backdrop-blur-md border border-white/10 p-6 rounded space-y-4">
        <input
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-black border border-white/10 p-3 rounded"
          placeholder="Name"
        />

        <input
          value={form.email || ""}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-black border border-white/10 p-3 rounded"
          placeholder="Email"
        />

        <input
          value={form.phone || ""}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-black border border-white/10 p-3 rounded"
          placeholder="Phone"
        />

        <div className="flex items-center gap-2">
          <Zap size={16} className="text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
          Credits: {credits}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setCredits((c) => c + 100)} className={`bg-emerald-500 px-4 py-2 rounded ${BTN}`}>
            <span className="inline-flex items-center gap-2">
              <CreditCard size={14} /> Buy Credits
            </span>
          </button>

          <button className={`bg-zinc-800 px-4 py-2 rounded ${BTN}`}>Upgrade Plan</button>
        </div>

        <button className="text-sm text-red-400 hover:text-red-300">Cancel Account</button>

        <button onClick={onLogout} className="text-sm text-zinc-300 hover:text-white inline-flex items-center gap-2">
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  );
}

function CompanyManager({ companies, setCompanies }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [pitch, setPitch] = useState("");

  function save() {
    if (!name) return;
    if (companies.length >= 3) {
      alert("Maximum 3 companies allowed");
      return;
    }

    setCompanies([...companies, { name, website, description, pitch }]);
    setName("");
    setWebsite("");
    setDescription("");
    setPitch("");
  }

  return (
    <div className="bg-zinc-900/70 backdrop-blur-md border border-white/10 p-4 rounded space-y-2">
      <div className="text-sm font-semibold">My Companies</div>

      <input
        placeholder="Company"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-black border border-white/10 p-2 rounded"
      />

      <input
        placeholder="Website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="w-full bg-black border border-white/10 p-2 rounded"
      />

      <textarea
        placeholder="What the company does"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-black border border-white/10 p-2 rounded"
      />

      <textarea
        placeholder="What you are pitching"
        value={pitch}
        onChange={(e) => setPitch(e.target.value)}
        className="w-full bg-black border border-white/10 p-2 rounded"
      />

      <button onClick={save} className={`bg-emerald-500 px-3 py-1 rounded text-sm ${BTN}`}>
        Save Company
      </button>

      {companies.map((company) => (
        <div key={company.name} className="text-xs bg-black p-2 rounded">
          {company.name}
        </div>
      ))}
    </div>
  );
}

function ContactCard({ contact, company, senderCompany, newsHook }) {
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function generate() {
    setIsGenerating(true);
    const nextEmail = await generateEmail(contact, company, senderCompany, newsHook);
    setEmail(typeof nextEmail === "string" ? nextEmail : "");
    setIsGenerating(false);
  }

  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:border-emerald-500/40 transition rounded-lg p-4 space-y-2">
      <div className="flex justify-between">
        <div>
          <div className="font-semibold flex items-center gap-2">
            {contact.name}
            {contact.verified && <BadgeCheck size={14} className="text-green-400" />}
          </div>
          <div className="text-xs text-zinc-400">{contact.title}</div>
        </div>

        <button
          onClick={async () => {
            try {
              const res = await fetch(`/api/linkedin-lookup?name=${encodeURIComponent(contact.name)}&company=${encodeURIComponent(company)}`);
              const data = await res.json();
              if (data?.linkedin) {
                window.open(data.linkedin, "_blank");
              } else if (contact.linkedin) {
                window.open(contact.linkedin, "_blank");
              } else {
                alert("No LinkedIn profile found");
              }
            } catch {
              if (contact.linkedin) window.open(contact.linkedin, "_blank");
            }
          }}
          className="text-blue-400 hover:text-blue-300"
        >
          <Linkedin size={16} />
        </button>
      </div>

      <div className="text-xs flex gap-2 items-center">
        <Mail size={12} /> {contact.email}
      </div>

      <div className="text-xs flex gap-2 items-center">
        <Phone size={12} /> {contact.phone}
      </div>

      <p className="text-xs text-zinc-400">{contact.bio}</p>

      <div className="text-[11px] text-emerald-300 flex items-center gap-1">
        <BadgeCheck size={12} /> Email Confidence {contact.confidence}%
      </div>

      {!email && (
        <button onClick={generate} className={`text-xs bg-emerald-500 px-3 py-1 rounded ${BTN}`}>
          {isGenerating ? "Generating…" : "Generate Email"}
        </button>
      )}

      {!!email && (
        <div className="space-y-2">
          <textarea value={email} readOnly className="w-full bg-black text-xs p-2 rounded" />

          <button
            onClick={() => copy(email)}
            className={`text-xs bg-emerald-600 px-3 py-1 rounded flex gap-1 items-center ${BTN}`}
          >
            <Copy size={12} /> Copy
          </button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ credits, setCredits, user }) {
  const [vertical, setVertical] = useState("");
  const [results, setResults] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [tab, setTab] = useState("companies");
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const savedCompanies = safeJsonParse(localStorage.getItem(buildStorageKey(user, "companies")), []);
    const savedHistory = safeJsonParse(localStorage.getItem(buildStorageKey(user, "history")), []);
    const savedSelected = safeJsonParse(localStorage.getItem(buildStorageKey(user, "selectedCompany")), null);
    setCompanies(savedCompanies);
    setHistory(savedHistory);
    setSelectedCompany(savedSelected);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(buildStorageKey(user, "companies"), JSON.stringify(companies));
  }, [companies, user]);

  useEffect(() => {
    localStorage.setItem(buildStorageKey(user, "history"), JSON.stringify(history));
  }, [history, user]);

  useEffect(() => {
    localStorage.setItem(buildStorageKey(user, "selectedCompany"), JSON.stringify(selectedCompany));
  }, [selectedCompany, user]);

  function startLoadingAnimation(onComplete, durationMs) {
    setLoading(true);
    setScanProgress(0);
    setLiveCount(0);

    const progressInterval = window.setInterval(() => {
      setScanProgress((p) => Math.min(p + 10, 90));
      setLiveCount((c) => c + Math.floor(Math.random() * 2) + 1);
    }, 120);

    window.setTimeout(async () => {
      window.clearInterval(progressInterval);
      await onComplete();
      setScanProgress(100);
      window.setTimeout(() => {
        setLoading(false);
        setScanProgress(0);
      }, 300);
    }, durationMs);
  }

  async function scan() {
    if (!selectedCompany) {
      alert("Select a company first");
      return;
    }

    await startLoadingAnimation(async () => {
      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vertical,
            company: selectedCompany.name,
            pitch: selectedCompany.pitch,
          }),
        });

        if (!res.ok) throw new Error("Discovery API failed");
        const data = await res.json();

        const newResults = (Array.isArray(data?.companies) ? data.companies : []).map((c) =>
          generateCompanyFromApi(c, vertical, selectedCompany)
        );

        if (newResults.length === 0) {
          const fallbackResults = [
            generateCompanyFallback(cursor, vertical, selectedCompany),
            generateCompanyFallback(cursor + 1, vertical, selectedCompany),
            generateCompanyFallback(cursor + 2, vertical, selectedCompany),
          ];
          setCursor((prev) => prev + fallbackResults.length);
          setResults(fallbackResults);
        } else {
          setCursor((prev) => prev + newResults.length);
          setResults(newResults);
        }

        setHistory((prev) => [
          { vertical, company: selectedCompany.name, timestamp: new Date().toLocaleString() },
          ...prev,
        ]);
        setCredits((prev) => prev - 1);
      } catch {
        const fallbackResults = [
          generateCompanyFallback(cursor, vertical, selectedCompany),
          generateCompanyFallback(cursor + 1, vertical, selectedCompany),
          generateCompanyFallback(cursor + 2, vertical, selectedCompany),
        ];

        setCursor((prev) => prev + fallbackResults.length);
        setResults(fallbackResults);
        setHistory((prev) => [
          { vertical, company: selectedCompany.name, timestamp: new Date().toLocaleString() },
          ...prev,
        ]);
        setCredits((prev) => prev - 1);
      }
    }, 900);
  }

  async function loadMore() {
    await startLoadingAnimation(async () => {
      try {
        const res = await fetch("/api/discover-more", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vertical,
            cursor,
            company: selectedCompany?.name,
            pitch: selectedCompany?.pitch,
          }),
        });

        if (!res.ok) throw new Error("Load more API failed");
        const data = await res.json();

        const more = (Array.isArray(data?.companies) ? data.companies : []).map((c) =>
          generateCompanyFromApi(c, vertical, selectedCompany)
        );

        if (more.length === 0) {
          const fallbackMore = [
            generateCompanyFallback(cursor, vertical, selectedCompany),
            generateCompanyFallback(cursor + 1, vertical, selectedCompany),
            generateCompanyFallback(cursor + 2, vertical, selectedCompany),
          ];
          setCursor((prev) => prev + fallbackMore.length);
          setResults((prev) => [...prev, ...fallbackMore]);
        } else {
          setCursor((prev) => prev + more.length);
          setResults((prev) => [...prev, ...more]);
        }

        setCredits((prev) => prev - 1);
      } catch {
        const fallbackMore = [
          generateCompanyFallback(cursor, vertical, selectedCompany),
          generateCompanyFallback(cursor + 1, vertical, selectedCompany),
          generateCompanyFallback(cursor + 2, vertical, selectedCompany),
        ];

        setCursor((prev) => prev + fallbackMore.length);
        setResults((prev) => [...prev, ...fallbackMore]);
        setCredits((prev) => prev - 1);
      }
    }, 800);
  }

  function exportCSV() {
    const rows = results.map((result) => `${result.company},${result.score},${result.location}`);
    downloadCsv("prospects.csv", rows);
  }

  const companyCount = results.length;
  const decisionMakerCount = useMemo(
    () => results.reduce((sum, result) => sum + result.contacts.length, 0),
    [results]
  );
  const emailReadyCount = decisionMakerCount;
  const avgScore = Math.round(
    results.reduce((sum, result) => sum + result.score, 0) / (results.length || 1)
  );

  return (
    <div className="flex">
      <div className="w-80 p-6 border-r border-white/10 space-y-6">
        <CompanyManager companies={companies} setCompanies={setCompanies} />

        <div className="space-y-2">
          <div className="text-sm">Select Company</div>

          {companies.map((company) => (
            <button
              key={company.name}
              onClick={() => setSelectedCompany(company)}
              className="w-full text-left bg-zinc-900 p-2 rounded hover:bg-zinc-800"
            >
              {company.name}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900/70 backdrop-blur-md border border-white/10 p-4 rounded space-y-2">
          <div className="text-sm font-semibold">Company Research</div>

          <input
            placeholder="SaaS vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="w-full bg-black border border-white/10 p-2 rounded"
          />

          <button onClick={scan} className={`w-full bg-emerald-500 py-2 rounded ${BTN}`}>
            {loading ? "Scanning…" : "Start Scan (1 credit)"}
          </button>
        </div>

        <div>
          <div className="text-xs text-zinc-400 flex gap-2 items-center mb-2">
            <Clock size={12} /> Scan History
          </div>

          {history.map((item, index) => (
            <div key={`${item.company}-${item.vertical}-${index}`} className="text-sm bg-zinc-900 p-2 rounded mb-1">
              <div>{item.company} → {item.vertical}</div>
              <div className="text-[11px] text-zinc-500">{item.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-zinc-900/70 backdrop-blur-md border border-white/10 p-4 rounded text-center">
            <div className="text-lg font-semibold">{companyCount}</div>
            <div className="text-xs text-zinc-400">Companies</div>
          </div>

          <div className="bg-zinc-900/70 backdrop-blur-md border border-white/10 p-4 rounded text-center">
            <div className="text-lg font-semibold">{decisionMakerCount}</div>
            <div className="text-xs text-zinc-400">Decision Makers</div>
          </div>

          <div className="bg-zinc-900/70 backdrop-blur-md border border-white/10 p-4 rounded text-center">
            <div className="text-lg font-semibold">{emailReadyCount}</div>
            <div className="text-xs text-zinc-400">Emails Ready</div>
          </div>

          <div className="bg-zinc-900/70 backdrop-blur-md border border-white/10 p-4 rounded text-center">
            <div className="text-lg font-semibold">{avgScore}</div>
            <div className="text-xs text-zinc-400">Avg Score</div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            {credits} credits
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className={`bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700/70 px-4 py-2 rounded ${BTN}`}
            >
              Export CSV
            </button>

            <button onClick={loadMore} className={`bg-emerald-600 px-4 py-2 rounded ${BTN}`}>
              {loading ? "Loading…" : "Load More Companies"}
            </button>
          </div>
        </div>

        <div className="flex gap-4 border-b border-white/10 pb-2 text-sm">
          <button onClick={() => setTab("companies")} className={tab === "companies" ? "text-white" : "text-zinc-400"}>
            Companies
          </button>
          <button onClick={() => setTab("contacts")} className={tab === "contacts" ? "text-white" : "text-zinc-400"}>
            Decision Makers
          </button>
          <button onClick={() => setTab("emails")} className={tab === "emails" ? "text-white" : "text-zinc-400"}>
            Email Drafts
          </button>
        </div>

        {loading && (
          <div className="space-y-4 py-10">
            <div className="text-sm text-zinc-400">Discovering companies… {liveCount}</div>
            <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden">
              <div
                className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)] transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-zinc-900/70 rounded border border-white/10 animate-pulse" />
              <div className="h-24 bg-zinc-900/70 rounded border border-white/10 animate-pulse" />
            </div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={`${result.company}-${index}`}
                  className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 hover:border-emerald-500/40 transition p-4 rounded"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <Building size={14} /> {result.company}
                    </div>

                    <div className="text-sm text-emerald-400 font-semibold">{result.score}/100</div>
                  </div>

                  <div className="mt-2 h-2 w-full bg-zinc-800 rounded overflow-hidden relative">
                    <div
                      className="h-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.95)] transition-all duration-700 ease-out"
                      style={{ width: `${result.score}%` }}
                    />
                  </div>

                  <p className="text-xs text-zinc-400 mt-2">{result.description}</p>

                  <div className="mt-2 text-[11px] text-emerald-300/80 bg-black/40 border border-white/5 rounded p-2">
                    <div>Signal: {result.news}</div>
                    <div>AI Insight: {result.aiInsight}</div>
                  </div>

                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700/70 px-2 py-1 rounded">
                      ICP Match
                    </span>
                    <span className="bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700/70 px-2 py-1 rounded">
                      Hiring
                    </span>
                    <span className="bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700/70 px-2 py-1 rounded">
                      Growth Signal
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {result.contacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        company={result.company}
                        senderCompany={selectedCompany}
                        newsHook={result.news}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Landing({ setPage }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-24 max-w-5xl mx-auto">
      <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
        AI Prospector
      </h1>

      <p className="text-zinc-300 text-lg max-w-2xl mb-10">
        Discover SaaS companies, find real decision makers, detect buying signals,
        and generate personalized outreach in seconds. ProspectAI turns prospecting
        research that normally takes hours into a single click.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => setPage("login")}
          className={`bg-emerald-500 px-6 py-3 rounded-lg text-sm font-semibold ${BTN}`}>
          Start Prospecting
        </button>

        <button
          onClick={() => setPage("pricing")}
          className={`bg-zinc-800 px-6 py-3 rounded-lg text-sm font-semibold ${BTN}`}>
          View Pricing
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-20 text-left">
        <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Company Discovery</h3>
          <p className="text-sm text-zinc-400">
            Crawl SaaS directories and discover companies that match your ideal
            customer profile automatically.
          </p>
        </div>

        <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Decision Maker Intelligence</h3>
          <p className="text-sm text-zinc-400">
            Extract founders, product leaders, and partnership executives with
            verified contact data.
          </p>
        </div>

        <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-2">AI Email Generation</h3>
          <p className="text-sm text-zinc-400">
            Generate highly personalized cold emails using company signals,
            leadership context, and industry insights.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => safeJsonParse(localStorage.getItem("prospectai:user"), null));
  const [credits, setCredits] = useState(() => safeJsonParse(localStorage.getItem("prospectai:credits"), 100));
  const [page, setPage] = useState("landing");

  useEffect(() => {
    runDevTests();

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

  if (!user && page === "login") {
    return (
      <div className={backgroundClass}>
        <Navbar setPage={setPage} />
        <AuthScreen onAuth={setUser} />
      </div>
    );
  }

  if (!user && page === "pricing") {
    return (
      <div className={backgroundClass}>
        <Navbar setPage={setPage} />
        <Pricing />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={backgroundClass}>
        <Navbar setPage={setPage} />
        <Landing setPage={setPage} />
      </div>
    );
  }

  return (
    <div className={backgroundClass}>
      <Navbar setPage={setPage} />

      {page === "dashboard" && (
        <Dashboard credits={credits} setCredits={setCredits} user={user} />
      )}

      {page === "pricing" && <Pricing />}

      {page === "profile" && (
        <Profile user={user} credits={credits} setCredits={setCredits} onLogout={() => setUser(null)} />
      )}
    </div>
  );
}
