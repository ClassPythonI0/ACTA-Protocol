import { publicClient } from "@/lib/client";
import {
  CONTRACTS,
  AGENT_REGISTRY_ABI,
  REPUTATION_ENGINE_ABI,
} from "@/lib/contracts";

// The deployer wallet that registered all agents
const DEPLOYER = "0xf3E0C8078Dd02cF297e3d030354d12779150e0E5";

async function getAgents() {
  // Use getAgentsByOwner — no block range limit, no getLogs needed
  const agentIds = await publicClient.readContract({
    address: CONTRACTS.AgentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getAgentsByOwner",
    args: [DEPLOYER as `0x${string}`],
  }) as `0x${string}`[];

  const agents = await Promise.all(
    agentIds.map(async (agentId) => {
      try {
        const agent = await publicClient.readContract({
          address: CONTRACTS.AgentRegistry,
          abi: AGENT_REGISTRY_ABI,
          functionName: "getAgent",
          args: [agentId],
        });
        let rep = null;
        try {
          rep = await publicClient.readContract({
            address: CONTRACTS.ReputationEngine,
            abi: REPUTATION_ENGINE_ABI,
            functionName: "getReputation",
            args: [agentId],
          });
        } catch {}
        return { agent, rep };
      } catch {
        return null;
      }
    })
  );

  return agents.filter(Boolean);
}

function shortHex(hex: string) {
  return hex.slice(0, 10) + "..." + hex.slice(-8);
}

function scoreColor(score: bigint) {
  const n = Number(score);
  if (n >= 700) return "text-emerald-400";
  if (n >= 500) return "text-yellow-400";
  return "text-red-400";
}

export const revalidate = 60;

export default async function RegistryPage() {
  const agents = await getAgents();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Agent Registry</h1>
        <p className="text-sm text-gray-500">
          All AI agents registered on ACTA Protocol — Pillar 1: Identity
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
          {agents.length} agent{agents.length !== 1 ? "s" : ""} registered
        </span>
        <a
          href={`https://sepolia.basescan.org/address/${CONTRACTS.AgentRegistry}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View contract on Basescan →
        </a>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-xl border border-white/5 p-12 text-center text-gray-600 text-sm">
          No agents registered yet.
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((item, i) => {
            if (!item) return null;
            const { agent, rep } = item;
            const a = agent as {
              agentId: `0x${string}`;
              owner: string;
              name: string;
              model: string;
              capabilityHash: string;
              harnessType: string;
              registeredAt: bigint;
              active: boolean;
            };
            const r = rep as {
              score: bigint;
              totalJobs: bigint;
              passedJobs: bigint;
              failedJobs: bigint;
              lastUpdated: bigint;
              exists: boolean;
            } | null;

            return (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-indigo-500/20 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${a.active ? "bg-green-500" : "bg-gray-600"}`} />
                      <h2 className="text-white font-semibold text-sm">{a.name}</h2>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        {a.harnessType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 ml-4">Model: {a.model}</p>
                  </div>

                  {r && r.exists && (
                    <div className="text-right">
                      <div className={`text-lg font-bold ${scoreColor(r.score)}`}>
                        {r.score.toString()}<span className="text-xs text-gray-600">/1000</span>
                      </div>
                      <div className="text-[10px] text-gray-600">
                        {r.totalJobs.toString()} jobs &middot; {r.passedJobs.toString()} passed
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-600">
                  <div>
                    <span className="text-gray-700">agentId:</span>{" "}
                    <span className="text-gray-400 break-all">{shortHex(a.agentId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">owner:</span>{" "}
                    <a
                      href={`https://sepolia.basescan.org/address/${a.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      {shortHex(a.owner)}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-700">capability:</span>{" "}
                    <span className="text-gray-400">{a.capabilityHash}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">registered:</span>{" "}
                    <span className="text-gray-400">
                      {new Date(Number(a.registeredAt) * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-700">agentId (full):</span>{" "}
                    <a
                      href={`https://sepolia.basescan.org/address/${CONTRACTS.AgentRegistry}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 break-all"
                    >
                      {a.agentId}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
