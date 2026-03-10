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
  CreditCard,
  LogOut,
} from "lucide-react";

const BTN =
  "transition-all duration-150 hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]";

const crawlerPool = [
  "FieldPulse","ServiceTitan","Housecall Pro","Jobber","Service Fusion","Kickserv","WorkWave",
  "RazorSync","mHelpDesk","Buildertrend","Tradify","SimPro","ServiceM8","FieldEdge","Vonigo",
  "ZenMaid","ServiceBridge","FieldRoutes","BlueFolder","Service Autopilot","ServiceMonster",
  "Smart Service","Thryv","ServiceTrade","FIELDBOSS","Commusoft","ServiceWorks","Loc8",
  "AroFlo","Joblogic"
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

/* ------------------------------------------------ */
/* EMAIL GENERATION */
/* ------------------------------------------------ */

function buildFallbackEmail(contact, company, senderCompany, newsHook, title, bio) {

  const first = (contact?.name || "there").split(" ")[0];
  const senderName = senderCompany?.name || "our team";
  const pitch = senderCompany?.pitch || "embedded payments";
  const role = title || "your role";

  const safeNews =
    typeof newsHook === "string" && newsHook.trim()
      ? newsHook
      : "growing in the market";

  const openers = [
    `Saw that ${company} is ${safeNews}.`,
    `Noticed ${company} has been ${safeNews}.`,
    `Looks like ${company} is ${safeNews}.`,
  ];

  const pains = [
    "A lot of vertical SaaS platforms hit friction around payments and monetization as they scale.",
    "Teams building contractor software often run into billing and collection workflow problems.",
    "Many platforms eventually need tighter payment workflows built directly into the product.",
  ];

  const value = [
    `${senderName} helps platforms embed payments directly into their workflow.`,
    `We've been helping SaaS teams add native payment infrastructure into their product.`,
    `Our team works with SaaS companies turning payments into a core product feature.`,
  ];

  const opener = openers[Math.floor(Math.random() * openers.length)];
  const pain = pains[Math.floor(Math.random() * pains.length)];
  const val = value[Math.floor(Math.random() * value.length)];

  return `Hi ${first},

${opener} Given your role as ${role}, figured this might be relevant.

${pain}

${val}

Worth a quick conversation if you're exploring ${pitch}?`;
}

async function generateEmail(contact, company, senderCompany, newsHook) {

  try {

    const res = await fetch("/api/generate-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    throw new Error("Invalid response");

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

/* ------------------------------------------------ */
/* COMPANY GENERATION */
/* ------------------------------------------------ */

function generateCompanyFallback(index, vertical, senderCompany) {

  const companyName = crawlerPool[index % crawlerPool.length];
  const slug = normalizeCompanySlug(companyName);

  const newsPool = [
    "recently raised funding",
    "launching new integrations",
    "expanding into new markets",
    "hiring aggressively",
    "rolling out new billing workflows",
  ];

  return {
    id: `${slug}-${index}`,
    company: companyName,
    score: 80 + (index % 15),
    location: "United States",
    news: newsPool[index % newsPool.length],
    description: `${companyName} is a ${vertical} SaaS platform.`,
    aiInsight: `Likely a strong candidate for ${senderCompany?.pitch || "payments"} integrations.`,
    contacts: [
      {
        id: `${slug}-1`,
        name: "Alex Carter",
        title: "CEO",
        email: `alex@${slug}.com`,
        phone: "(555) 222-1111",
        linkedin: "https://linkedin.com",
        verified: true,
        confidence: 92,
        bio: "Founder scaling vertical SaaS platforms.",
      },
      {
        id: `${slug}-2`,
        name: "Jordan Lee",
        title: "VP Product",
        email: `jordan@${slug}.com`,
        phone: "(555) 333-1111",
        linkedin: "https://linkedin.com",
        verified: true,
        confidence: 88,
        bio: "Product leader focused on fintech integrations.",
      },
      {
        id: `${slug}-3`,
        name: "Taylor Smith",
        title: "Head of Partnerships",
        email: `taylor@${slug}.com`,
        phone: "(555) 444-1111",
        linkedin: "https://linkedin.com",
        verified: true,
        confidence: 85,
        bio: "Leads SaaS partnership ecosystems.",
      },
    ],
  };
}

/* ------------------------------------------------ */
/* COPY UTILITY */
/* ------------------------------------------------ */

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

/* ------------------------------------------------ */
/* CONTACT CARD */
/* ------------------------------------------------ */

function ContactCard({ contact, company, senderCompany, newsHook }) {

  const [email, setEmail] = useState("");

  async function generate() {
    const result = await generateEmail(contact, company, senderCompany, newsHook);
    setEmail(result);
  }

  return (
    <div className="bg-zinc-900 p-4 rounded space-y-2 border border-white/10">

      <div className="flex justify-between">

        <div>
          <div className="font-semibold flex gap-2 items-center">
            {contact.name}
            {contact.verified && (
              <BadgeCheck size={14} className="text-green-400" />
            )}
          </div>
          <div className="text-xs text-zinc-400">{contact.title}</div>
        </div>

        <a
          href={contact.linkedin}
          target="_blank"
          className="text-blue-400 hover:text-blue-300"
        >
          <Linkedin size={16} />
        </a>

      </div>

      <div className="text-xs flex gap-2 items-center">
        <Mail size={12} /> {contact.email}
      </div>

      <div className="text-xs flex gap-2 items-center">
        <Phone size={12} /> {contact.phone}
      </div>

      <p className="text-xs text-zinc-400">{contact.bio}</p>

      {!email && (
        <button
          onClick={generate}
          className={`text-xs bg-emerald-500 px-3 py-1 rounded ${BTN}`}
        >
          Generate Email
        </button>
      )}

      {email && (
        <div className="space-y-2">
          <textarea
            value={email}
            readOnly
            className="w-full bg-black text-xs p-2 rounded"
          />
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

/* ------------------------------------------------ */
/* APP */
/* ------------------------------------------------ */

export default function App() {

  const [results, setResults] = useState([]);

  useEffect(() => {
    const demo = [
      generateCompanyFallback(0,"field service",{pitch:"embedded payments"}),
      generateCompanyFallback(1,"field service",{pitch:"embedded payments"})
    ];
    setResults(demo);
  }, []);

  return (

    <div className="min-h-screen bg-black text-white p-10">

      <h1 className="text-3xl font-bold mb-8">ProspectAI</h1>

      <div className="grid grid-cols-2 gap-8">

        {results.map((result) => (

          <div
            key={result.id}
            className="bg-zinc-900 p-4 rounded border border-white/10"
          >

            <div className="flex justify-between">
              <div className="flex gap-2 items-center">
                <Building size={14} />
                {result.company}
              </div>
              <div className="text-emerald-400">{result.score}</div>
            </div>

            <p className="text-xs text-zinc-400 mt-2">{result.description}</p>

            <div className="space-y-3 mt-3">

              {result.contacts.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  company={result.company}
                  senderCompany={{name:"North",pitch:"embedded payments"}}
                  newsHook={result.news}
                />
              ))}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}