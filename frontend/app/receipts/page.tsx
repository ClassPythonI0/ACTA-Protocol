import { publicClient } from "@/lib/client";
import {
  CONTRACTS,
  RECEIPT_REGISTRY_ABI,
  AGENT_REGISTRY_ABI,
  REPUTATION_ENGINE_ABI,
  ACTION_LABELS,
  ACTION_COLORS,
} from "@/lib/contracts";

const DEPLOYER = "0xf3E0C8078Dd02cF297e3d030354d12779150e0E5";

async function getReceipts() {
  // Get all agent IDs for the deployer
  const agentIds = await publicClient.readContract({
    address: CONTRACTS.AgentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getAgentsByOwner",
    args: [DEPLOYER as `0x${string}`],
  }) as `0x${string}`[];

  // Get agent names
  const agentNames: Record<string, string> = {};
  await Promise.all(
    agentIds.map(async (agentId) => {
      try {
        const agent = await publicClient.readContract({
          address: CONTRACTS.AgentRegistry,
          abi: AGENT_REGISTRY_ABI,
          functionName: "getAgent",
          args: [agentId],
        }) as { name: string };
        agentNames[agentId] = agent.name;
      } catch {
        agentNames[agentId] = agentId.slice(0, 10) + "...";
      }
    })
  );

  // Get receipt IDs for each agent
  const allReceiptIds: Array<{ receiptId: `0x${string}`; agentId: `0x${string}` }> = [];
  await Promise.all(
    agentIds.map(async (agentId) => {
      try {
        const ids = await publicClient.readContract({
          address: CONTRACTS.ReceiptRegistry,
          abi: RECEIPT_REGISTRY_ABI,
          functionName: "getAgentHistory",
          args: [agentId],
        }) as `0x${string}`[];
        ids.forEach((receiptId) => allReceiptIds.push({ receiptId, agentId }));
      } catch {}
    })
  );

  // Fetch full receipt data (last 50, most recent first)
  const recent = allReceiptIds.slice(-50).reverse();
  const receipts = await Promise.all(
    recent.map(async ({ receiptId, agentId }) => {
      try {
        const r = await publicClient.readContract({
          address: CONTRACTS.ReceiptRegistry,
          abi: RECEIPT_REGISTRY_ABI,
          functionName: "getReceipt",
          args: [receiptId],
        }) as {
          receiptId: `0x${string}`;
          jobId: `0x${string}`;
          parentReceiptId: `0x${string}`;
          agentId: `0x${string}`;
          actionType: number;
          inputHash: `0x${string}`;
          outputHash: `0x${string}`;
          encryptedCID: string;
          timestamp: bigint;
          passed: boolean;
        };
        return { ...r, agentName: agentNames[agentId] ?? agentId.slice(0, 10) + "..." };
      } catch {
        return null;
      }
    })
  );

  return receipts.filter(Boolean);
}

function shortHex(hex: string) {
  if (!hex || hex === "0x" + "0".repeat(64)) return "—";
  return hex.slice(0, 10) + "..." + hex.slice(-6);
}

export const revalidate = 60;

export default async function ReceiptsPage() {
  const receipts = await getReceipts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Audit Trail</h1>
        <p className="text-sm text-gray-500">
          Cryptographic receipts for every agent action — Pillar 3: Audit Trail.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.entries(ACTION_LABELS).map(([k, v]) => (
          <span
            key={k}
            className={`px-2 py-0.5 rounded border ${ACTION_COLORS[Number(k)]}`}
          >
            {v}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
          {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
        </span>
        <a
          href={`https://sepolia.basescan.org/address/${CONTRACTS.ReceiptRegistry}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300"
        >
          View contract on Basescan →
        </a>
      </div>

      {receipts.length === 0 ? (
        <div className="rounded-xl border border-white/5 p-12 text-center text-gray-600 text-sm">
          No receipts issued yet.
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map((r, i) => {
            if (!r) return null;
            return (
              <div
                key={i}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${ACTION_COLORS[Number(r.actionType)]}`}>
                      {ACTION_LABELS[Number(r.actionType)]}
                    </span>
                    <span className="text-white text-sm font-medium">{r.agentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        r.passed
                          ? "text-emerald-400 bg-emerald-400/10"
                          : "text-red-400 bg-red-400/10"
                      }`}
                    >
                      {r.passed ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-[11px] text-gray-600">
                      {r.timestamp ? new Date(Number(r.timestamp) * 1000).toLocaleString() : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-gray-600">
                  <div>
                    <span className="text-gray-700">receiptId:</span>{" "}
                    <span className="text-gray-400">{shortHex(r.receiptId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">jobId:</span>{" "}
                    <span className="text-gray-400">{shortHex(r.jobId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">inputHash:</span>{" "}
                    <span className="text-gray-400">{shortHex(r.inputHash)}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">outputHash:</span>{" "}
                    <span className="text-gray-400">{shortHex(r.outputHash)}</span>
                  </div>
                  {r.encryptedCID && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-700">encryptedCID:</span>{" "}
                      <span className="text-purple-400">{r.encryptedCID || "—"}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
