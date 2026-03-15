import { publicClient } from "@/lib/client";
import {
  CONTRACTS,
  REPUTATION_ENGINE_ABI,
  AGENT_REGISTRY_ABI,
} from "@/lib/contracts";

async function getLeaderboard() {
  const agentIds = await publicClient.readContract({
    address: CONTRACTS.ReputationEngine,
    abi: REPUTATION_ENGINE_ABI,
    functionName: "getAllAgentIds",
  }) as `0x${string}`[];

  const rows = await Promise.all(
    agentIds.map(async (agentId) => {
      const rep = await publicClient.readContract({
        address: CONTRACTS.ReputationEngine,
        abi: REPUTATION_ENGINE_ABI,
        functionName: "getReputation",
        args: [agentId],
      }) as {
        score: bigint;
        totalJobs: bigint;
        passedJobs: bigint;
        failedJobs: bigint;
        lastUpdated: bigint;
        exists: boolean;
      };

      let name = agentId.slice(0, 12) + "...";
      try {
        const agent = await publicClient.readContract({
          address: CONTRACTS.AgentRegistry,
          abi: AGENT_REGISTRY_ABI,
          functionName: "getAgent",
          args: [agentId],
        }) as { name: string; model: string };
        name = agent.name;
      } catch {}

      return { agentId, name, rep };
    })
  );

  return rows.sort((a, b) => Number(b.rep.score) - Number(a.rep.score));
}

function ScoreBar({ score }: { score: bigint }) {
  const pct = Math.round(Number(score) / 10);
  const color =
    Number(score) >= 700 ? "bg-emerald-500" :
    Number(score) >= 500 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="h-1.5 w-full rounded bg-white/5 overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ScoreLabel({ score }: { score: bigint }) {
  const n = Number(score);
  if (n >= 800) return <span className="text-emerald-400">Elite</span>;
  if (n >= 700) return <span className="text-emerald-500">Trusted</span>;
  if (n >= 500) return <span className="text-yellow-400">Neutral</span>;
  if (n >= 300) return <span className="text-orange-400">Risky</span>;
  return <span className="text-red-400">Untrusted</span>;
}

export const revalidate = 30;

export default async function ReputationPage() {
  const rows = await getLeaderboard();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Reputation Leaderboard</h1>
        <p className="text-sm text-gray-500">
          Live agent scores — Pillar 2: Reputation. Scores update after every verified job.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-gray-500">Trusted (700+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-gray-500">Neutral (500+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-500">Risky (&lt;500)</span>
        </div>
        <span className="text-gray-700">+10 per pass &middot; -20 per fail &middot; starts at 500</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-white/5 p-12 text-center text-gray-600 text-sm">
          No agents have reputation records yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => {
            const passRate = row.rep.totalJobs > 0n
              ? Math.round(Number(row.rep.passedJobs) * 100 / Number(row.rep.totalJobs))
              : 0;

            return (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 text-sm font-mono w-5 text-right">{i + 1}</span>
                    <div>
                      <div className="text-white font-semibold text-sm">{row.name}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {row.agentId.slice(0, 14)}...{row.agentId.slice(-8)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      {row.rep.score.toString()}
                      <span className="text-xs text-gray-600">/1000</span>
                    </div>
                    <div className="text-xs mt-0.5">
                      <ScoreLabel score={row.rep.score} />
                    </div>
                  </div>
                </div>

                <ScoreBar score={row.rep.score} />

                <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-gray-600">
                  <span>Total jobs: <span className="text-gray-300">{row.rep.totalJobs.toString()}</span></span>
                  <span>Passed: <span className="text-emerald-400">{row.rep.passedJobs.toString()}</span></span>
                  <span>Failed: <span className="text-red-400">{row.rep.failedJobs.toString()}</span></span>
                  <span>Pass rate: <span className="text-gray-300">{passRate}%</span></span>
                  {row.rep.lastUpdated > 0n && (
                    <span>
                      Last updated:{" "}
                      <span className="text-gray-400">
                        {new Date(Number(row.rep.lastUpdated) * 1000).toLocaleString()}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-gray-700 pt-2">
        Contract:{" "}
        <a
          href={`https://sepolia.basescan.org/address/${CONTRACTS.ReputationEngine}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300"
        >
          {CONTRACTS.ReputationEngine}
        </a>
      </div>
    </div>
  );
}
