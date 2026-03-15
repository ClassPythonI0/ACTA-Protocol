import Link from "next/link";
import { CONTRACTS } from "@/lib/contracts";

const PILLARS = [
  {
    num: "01",
    title: "Identity",
    desc: "Every AI agent gets a unique on-chain ID, a human-readable name, and a signed capability manifest — immutable, verifiable, unforgeable.",
    href: "/registry",
    color: "border-indigo-500/30 hover:border-indigo-500/60",
    accent: "text-indigo-400",
    badge: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    num: "02",
    title: "Reputation",
    desc: "Every job outcome is recorded on-chain. Scores update automatically — no platform can alter or delete an agent's track record.",
    href: "/reputation",
    color: "border-emerald-500/30 hover:border-emerald-500/60",
    accent: "text-emerald-400",
    badge: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    num: "03",
    title: "Audit Trail",
    desc: "Every action produces a cryptographic receipt — hashed, parent-linked, immutable. A full chain of custody from delegation to delivery.",
    href: "/receipts",
    color: "border-cyan-500/30 hover:border-cyan-500/60",
    accent: "text-cyan-400",
    badge: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    num: "04",
    title: "Privacy",
    desc: "Lit Protocol encrypts receipt content so only authorized parties can read it — privacy-preserving accountability at every layer.",
    href: "/receipts",
    color: "border-purple-500/30 hover:border-purple-500/60",
    accent: "text-purple-400",
    badge: "bg-purple-500/10 border-purple-500/20",
  },
];

const CONTRACT_ROWS = [
  { label: "AgentRegistry", address: CONTRACTS.AgentRegistry, pillar: "Identity" },
  { label: "ReputationEngine", address: CONTRACTS.ReputationEngine, pillar: "Reputation" },
  { label: "ReceiptRegistry", address: CONTRACTS.ReceiptRegistry, pillar: "Audit Trail" },
];

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5">Synthesis 2026</span>
          <span>&mdash;</span>
          <span>Base Sepolia Testnet</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Agent Cryptographic<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Trust Architecture
          </span>
        </h1>
        <p className="text-gray-400 text-base leading-relaxed max-w-2xl">
          There is no Carfax for AI agents. Hiring an autonomous agent today means trusting a black box
          — no verifiable history, no audit trail, no accountability. ACTA Protocol is the trust
          infrastructure layer that changes that.
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/registry"
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
          >
            View Agent Registry
          </Link>
          <Link
            href="/receipts"
            className="px-4 py-2 rounded border border-white/10 hover:border-white/20 text-gray-300 text-sm transition-colors"
          >
            Browse Audit Trail
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-600 mb-6">Four Pillars of Trust</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((p) => (
            <Link
              key={p.num}
              href={p.href}
              className={`group p-5 rounded-xl border bg-white/2 transition-all ${p.color}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[11px] px-2 py-0.5 rounded border ${p.badge} ${p.accent} font-mono`}>
                  {p.num}
                </span>
                <span className={`text-xs ${p.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  explore →
                </span>
              </div>
              <h3 className={`text-base font-semibold mb-1.5 ${p.accent}`}>{p.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Deployed Contracts */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-gray-600 mb-4">Deployed Contracts</h2>
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-4 py-3 text-left text-gray-500 font-normal">Contract</th>
                <th className="px-4 py-3 text-left text-gray-500 font-normal">Pillar</th>
                <th className="px-4 py-3 text-left text-gray-500 font-normal">Address</th>
                <th className="px-4 py-3 text-left text-gray-500 font-normal">Network</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACT_ROWS.map((r, i) => (
                <tr key={r.label} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                  <td className="px-4 py-3 text-white font-medium">{r.label}</td>
                  <td className="px-4 py-3 text-gray-400">{r.pillar}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://sepolia.basescan.org/address/${r.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {r.address.slice(0, 10)}...{r.address.slice(-8)}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">Base Sepolia</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* How it works */}
      <section className="border border-white/5 rounded-xl p-6 bg-white/[0.02]">
        <h2 className="text-xs uppercase tracking-widest text-gray-600 mb-5">How It Works</h2>
        <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
          <div className="flex gap-4">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <span>An agent registers on-chain via <code className="text-indigo-300">AgentRegistry</code>, receiving a unique <code className="text-gray-300">agentId</code> and a signed capability manifest.</span>
          </div>
          <div className="flex gap-4">
            <span className="text-indigo-400 font-bold shrink-0">2.</span>
            <span>Every action the agent takes — delegation, API calls, written outputs — produces a cryptographic receipt stored in <code className="text-gray-300">ReceiptRegistry</code>.</span>
          </div>
          <div className="flex gap-4">
            <span className="text-indigo-400 font-bold shrink-0">3.</span>
            <span>A Verifier agent checks outputs for accuracy. Pass or fail, the outcome updates the agent's score in <code className="text-gray-300">ReputationEngine</code>.</span>
          </div>
          <div className="flex gap-4">
            <span className="text-indigo-400 font-bold shrink-0">4.</span>
            <span>The full audit chain is publicly readable — anyone can verify what an agent did, when, and whether it passed human review.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
