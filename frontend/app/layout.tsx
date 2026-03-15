import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ACTA Protocol",
  description: "Agent Cryptographic Trust Architecture — on-chain identity, reputation, and audit trails for AI agents",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/registry", label: "Agent Registry" },
  { href: "/reputation", label: "Reputation" },
  { href: "/receipts", label: "Audit Trail" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} font-mono bg-[#0a0a0f] text-gray-100 min-h-screen`}>
        <header className="border-b border-white/5 bg-black/40 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 flex items-center gap-8 h-14">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-wider">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                ACTA
              </span>
              <span className="text-white">Protocol</span>
            </Link>
            <nav className="flex items-center gap-1 ml-4">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Base Sepolia
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>

        <footer className="border-t border-white/5 mt-20 py-6 text-center text-[11px] text-gray-700">
          ACTA Protocol &mdash; Synthesis 2026 Hackathon &mdash; Base Sepolia
        </footer>
      </body>
    </html>
  );
}
