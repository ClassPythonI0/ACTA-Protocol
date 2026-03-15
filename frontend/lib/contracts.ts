export const CONTRACTS = {
  AgentRegistry: "0xcd454b704FED5744893874D70DE1A3F3C0858407" as const,
  ReceiptRegistry: "0x7FbC5257a73b51Fd01859cd50C7A1eAA5E476EA1" as const,
  ReputationEngine: "0x82A335CC0a1F6c7636F9ab47c5C55c7c53684737" as const,
};

export const AGENT_REGISTRY_ABI = [
  {
    name: "registerAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "model", type: "string" },
      { name: "capabilityHash", type: "string" },
      { name: "harnessType", type: "string" },
    ],
    outputs: [{ name: "agentId", type: "bytes32" }],
  },
  {
    name: "getAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "agentId", type: "bytes32" },
          { name: "owner", type: "address" },
          { name: "name", type: "string" },
          { name: "model", type: "string" },
          { name: "capabilityHash", type: "string" },
          { name: "harnessType", type: "string" },
          { name: "registeredAt", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getAgentsByOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "AgentRegistered",
    type: "event",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "model", type: "string", indexed: false },
      { name: "registeredAt", type: "uint256", indexed: false },
    ],
  },
] as const;

export const RECEIPT_REGISTRY_ABI = [
  {
    name: "getReceipt",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "receiptId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "receiptId", type: "bytes32" },
          { name: "jobId", type: "bytes32" },
          { name: "parentReceiptId", type: "bytes32" },
          { name: "agentId", type: "bytes32" },
          { name: "actionType", type: "uint8" },
          { name: "inputHash", type: "bytes32" },
          { name: "outputHash", type: "bytes32" },
          { name: "encryptedCID", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "passed", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getAgentHistory",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "getJobAuditTrail",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "ReceiptIssued",
    type: "event",
    inputs: [
      { name: "receiptId", type: "bytes32", indexed: true },
      { name: "jobId", type: "bytes32", indexed: true },
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "actionType", type: "uint8", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export const REPUTATION_ENGINE_ABI = [
  {
    name: "getReputation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "score", type: "uint256" },
          { name: "totalJobs", type: "uint256" },
          { name: "passedJobs", type: "uint256" },
          { name: "failedJobs", type: "uint256" },
          { name: "lastUpdated", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getAllAgentIds",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "getPassRate",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "INITIAL_SCORE",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "ReputationUpdated",
    type: "event",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "passed", type: "bool", indexed: false },
      { name: "oldScore", type: "uint256", indexed: false },
      { name: "newScore", type: "uint256", indexed: false },
      { name: "totalJobs", type: "uint256", indexed: false },
      { name: "passRate", type: "uint256", indexed: false },
    ],
  },
] as const;

export const ACTION_LABELS: Record<number, string> = {
  0: "DELEGATION",
  1: "API_CALL",
  2: "PAYMENT",
  3: "OUTPUT",
  4: "VERIFICATION",
  5: "AGREEMENT",
};

export const ACTION_COLORS: Record<number, string> = {
  0: "text-purple-400 bg-purple-400/10",
  1: "text-blue-400 bg-blue-400/10",
  2: "text-yellow-400 bg-yellow-400/10",
  3: "text-green-400 bg-green-400/10",
  4: "text-cyan-400 bg-cyan-400/10",
  5: "text-orange-400 bg-orange-400/10",
};

export const BASE_SEPOLIA_CHAIN = {
  id: 84532,
  name: "Base Sepolia",
  rpcUrls: { default: { http: ["https://sepolia.base.org"] } },
  blockExplorers: {
    default: { name: "Basescan", url: "https://sepolia.basescan.org" },
  },
} as const;
