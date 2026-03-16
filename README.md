# ACTA Protocol — Agent Cryptographic Trust Architecture

> **Synthesis 2026 Hackathon** — trust infrastructure for autonomous AI agents on Ethereum

**Live demo:** [synthesis-tan.vercel.app](https://synthesis-tan.vercel.app) &nbsp;|&nbsp;
**Contracts:** [Base Sepolia](https://sepolia.basescan.org/address/0x7FbC5257a73b51Fd01859cd50C7A1eAA5E476EA1) &nbsp;|&nbsp;
**Gasless:** [Status Network](https://sepoliascan.status.network/address/0x434B0f694845331E1a4Ca41903ee76Fa89632be3)

---

## The Problem

There is no Carfax for AI agents.

Hiring an autonomous agent today means trusting a black box. No verifiable history. No audit trail. No accountability. If an agent makes a wrong call — a bad trade, a hallucinated output, an unauthorized payment — you have no on-chain record proving what happened, who instructed it, or whether anyone checked its work.

This is not a theoretical problem. Autonomous agents are already managing DeFi positions, executing governance votes, and processing real payments. The accountability layer was never built.

ACTA builds it.

---

## What ACTA Builds

Four on-chain pillars that together form a complete trust infrastructure for autonomous agents:

| Pillar | Contract | What it does |
|--------|----------|--------------|
| **01 Identity** | `AgentRegistry` | On-chain agent ID linked to capability manifest and operator wallet (ERC-8004) |
| **02 Reputation** | `ReputationEngine` | Permanent behavioral score — updated after every verified job, immutable history |
| **03 Audit Trail** | `ReceiptRegistry` | Cryptographic receipt for every agent action — hashed I/O, action type, parent-linked |
| **04 Privacy** | Lit Protocol *(roadmap)* | Encrypted receipt content — verifiable without exposing sensitive data |

Every receipt is parent-linked — forming a Merkle-like tree of provenance from the human's original request down through every agent delegation, API call, and verification step.

---

## Live Deployments

### Base Sepolia (Primary)

| Contract | Address | Explorer |
|----------|---------|---------|
| `AgentRegistry` | `0xcd454b704FED5744893874D70DE1A3F3C0858407` | [Basescan](https://sepolia.basescan.org/address/0xcd454b704FED5744893874D70DE1A3F3C0858407) |
| `ReceiptRegistry` | `0x7FbC5257a73b51Fd01859cd50C7A1eAA5E476EA1` | [Basescan](https://sepolia.basescan.org/address/0x7FbC5257a73b51Fd01859cd50C7A1eAA5E476EA1) |
| `ReputationEngine` | `0x82A335CC0a1F6c7636F9ab47c5C55c7c53684737` | [Basescan](https://sepolia.basescan.org/address/0x82A335CC0a1F6c7636F9ab47c5C55c7c53684737) |

### Status Network Sepolia (Gasless — Chain ID: 1660990954)

| Contract | Address | Explorer |
|----------|---------|---------|
| `AgentRegistry` | `0x910EF6BC7d8d1431968A6E6f0E8db0cB614A6998` | [Status Explorer](https://sepoliascan.status.network/address/0x910EF6BC7d8d1431968A6E6f0E8db0cB614A6998) |
| `ReceiptRegistry` | `0x434B0f694845331E1a4Ca41903ee76Fa89632be3` | [Status Explorer](https://sepoliascan.status.network/address/0x434B0f694845331E1a4Ca41903ee76Fa89632be3) |
| `ReputationEngine` | `0x97923CEc0BD68303F63BAe46337eE3E1Ed23825f` | [Status Explorer](https://sepoliascan.status.network/address/0x97923CEc0BD68303F63BAe46337eE3E1Ed23825f) |

On Status Network, ACTA issues receipts with `gasPrice = 0`. Every agent action is permanently auditable at zero cost — making granular audit trails economically viable at any scale.

---

## The Multi-Agent Pipeline

```
Human goal
    │
    ▼
OrchestratorAgent  ──[DECISION receipt]──▶ ReceiptRegistry
    │
    ├──▶ ResearchAgent
    │        │ x402 payment → stableenrich.dev/exa ($0.01 USDC)
    │        │ ──[PAYMENT receipt]──▶ ReceiptRegistry
    │        │ Claude Opus 4.6 analysis
    │        └──[API_CALL receipt]──▶ ReceiptRegistry
    │
    ├──▶ WriterAgent
    │        │ Structured report from research
    │        └──[OUTPUT receipt]──▶ ReceiptRegistry
    │
    └──▶ VerifierAgent
             │ Fact-checks against research, emits PASS/FAIL
             └──[VERIFY receipt]──▶ ReceiptRegistry
                      │
                      └──▶ ReputationEngine.recordOutcome(agentId, passed)
```

Every node in this graph is a real on-chain transaction. Every edge is a cryptographic hash. The full tree is reconstructable from chain state alone — no database, no indexer, no trust-me-bro.

---

## ERC-8004 Compliance

ACTA implements the ERC-8004 agent identity standard across the full stack:

- **`agent.json`** — machine-readable capability manifest with agent names, operator wallet, ERC-8004 registry address, supported tools, tech stack, and task categories → [`agent/agent.json`](agent/agent.json)
- **`agent_log.json`** — structured execution log from a live pipeline run showing decisions, tool calls, on-chain receipts, and final outputs → [`agent/agent_log.json`](agent/agent_log.json)
- **On-chain registration** — all 4 agents registered via `AgentRegistry.registerAgent()` with ERC-8004 compliant fields (name, model, capabilityHash, harnessType)

---

## AgentCash x402 Integration

The ResearchAgent pays for real web search data on every pipeline run via [AgentCash](https://agentcash.dev) — a USDC micropayment wallet for x402-protected APIs.

**Flow:**
1. ResearchAgent calls `stableenrich.dev/api/exa/search` — neural web search ($0.01 USDC per call)
2. Payment settles on Base via x402 protocol
3. A `PAYMENT` receipt is issued to `ReceiptRegistry` — on-chain proof of what the agent paid for and why
4. Real search results ground Claude's analysis in live web data

**Why this matters:** Every API call the agent makes is now permanently auditable. Not just what it decided — but what it paid to know.

---

## ENS Integration

Agent owner addresses and receipt issuers are resolved to ENS names throughout the frontend. Wherever a hex address appears, the UI first attempts ENS resolution — replacing `0xf3E0...` with a human-readable name. This applies across the Agent Registry, Audit Trail, and Reputation Leaderboard views.

---

## Reputation System

Agents start at `500/1000`. Every job outcome updates their score permanently on-chain:

| Outcome | Score change |
|---------|-------------|
| PASS | +10 |
| FAIL | −20 |

A new agent cannot fake a track record. A bad agent cannot reset theirs.

Current live scores (Base Sepolia):

| Agent | Score | Jobs | Pass Rate |
|-------|-------|------|-----------|
| OrchestratorAgent | 580+/1000 | 8+ | 100% |
| ResearchAgent | 580+/1000 | 8+ | 100% |
| WriterAgent | 560+/1000 | 6+ | 100% |
| VerifierAgent | 560+/1000 | 6+ | 100% |

---

## Repo Structure

```
.
├── contracts/                    Hardhat — Solidity smart contracts
│   ├── src/
│   │   ├── AgentRegistry.sol     ERC-8004 agent identity registry
│   │   ├── ReceiptRegistry.sol   Cryptographic audit trail
│   │   └── ReputationEngine.sol  Behavioral reputation scoring
│   ├── script/
│   │   ├── deploy.js             Base Sepolia deployment
│   │   └── deploy-status.js      Status Network gasless deployment
│   └── deployments/
│       ├── baseSepolia.json
│       └── statusSepolia.json
│
├── agent/                        Python multi-agent runtime
│   ├── agent.json                ERC-8004 capability manifest
│   ├── agent_log.json            Live structured execution log
│   ├── acta/
│   │   ├── client.py             Web3 client — all 3 contracts
│   │   ├── agentcash.py          AgentCash x402 payment integration
│   │   ├── crypto.py             SHA256 hashing + receipt generation
│   │   └── models.py             Pydantic models (Receipt, JobResult, ActionType)
│   ├── agents/
│   │   ├── base.py               BaseAgent — Claude + on-chain receipt submission
│   │   ├── orchestrator.py       Plans, delegates, coordinates the pipeline
│   │   ├── research.py           Web search (AgentCash) + Claude analysis
│   │   ├── writer.py             Structured report writer
│   │   └── verifier.py           Fact-checker — emits PASS/FAIL
│   ├── main.py                   Entry point — task menu, agent registration, pipeline
│   └── requirements.txt
│
└── frontend/                     Next.js 15 + Tailwind — live chain explorer
    ├── app/
    │   ├── page.tsx              Dashboard + pillar explainers
    │   ├── registry/             Agent Registry — all registered agents
    │   ├── reputation/           Leaderboard — live reputation scores
    │   └── receipts/             Audit trail — every on-chain receipt
    └── lib/
        ├── contracts.ts          ABIs + deployed addresses
        └── client.ts             viem public client (Base Sepolia)
```

---

## Running Locally

### Prerequisites
- Node 20+ and Python 3.11+
- Base Sepolia RPC URL + funded wallet (get ETH from [Optimism Faucet](https://console.optimism.io/faucet))
- Anthropic API key (Claude Opus 4.6)
- AgentCash wallet (get $3 free at [agentcash.dev](https://agentcash.dev) with invite code)

### 1. Smart Contracts

```bash
cd contracts
cp .env.example .env        # fill PRIVATE_KEY, BASE_SEPOLIA_RPC, BASESCAN_API_KEY
npm install --legacy-peer-deps
npx hardhat run script/deploy.js --network baseSepolia
```

### 2. Python Agent Runtime

```bash
cd agent
pip install -r requirements.txt

# contracts/.env — add:
# ANTHROPIC_API_KEY=sk-ant-...
# AGENT_REGISTRY_ADDRESS=0xcd454b704FED5744893874D70DE1A3F3C0858407
# RECEIPT_REGISTRY_ADDRESS=0x7FbC5257a73b51Fd01859cd50C7A1eAA5E476EA1
# REPUTATION_ENGINE_ADDRESS=0x82A335CC0a1F6c7636F9ab47c5C55c7c53684737

python main.py              # interactive task menu
python main.py 3            # run task 3 directly
```

**Available pipeline tasks:**

| # | Goal |
|---|------|
| 1 | Ethereum AI Agent Infrastructure Gap |
| 2 | On-Chain Reputation Systems |
| 3 | Agent Accountability & Audit Trails |
| 4 | Hiring an AI Agent: Trust & Verification |
| 5 | Multi-Agent Coordination Risks |
| 6 | Privacy vs. Transparency for AI Agents |
| 7 | The Cost of Unverified AI Agents in DeFi |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Primary L2 | Base Sepolia (Ethereum L2) |
| Gasless L2 | Status Network Sepolia (gasPrice = 0) |
| Smart Contracts | Solidity ^0.8.24, Hardhat 2.22.17 |
| Agent AI | Claude Opus 4.6 with adaptive thinking |
| Agent Runtime | Python 3.14, web3.py, Pydantic |
| Payments | AgentCash x402 (USDC on Base, $0.01/call) |
| Web Search | Exa via stableenrich.dev |
| Identity | ERC-8004 (AgentRegistry) |
| ENS | viem ENS resolution throughout frontend |
| Frontend | Next.js 15, Tailwind CSS, viem |
| Deployment | Vercel (frontend), Base Sepolia + Status Network (contracts) |

---

## Track Submissions

| Track | Sponsor | Why ACTA qualifies |
|-------|---------|-------------------|
| Agents With Receipts — ERC-8004 | Protocol Labs | Complete ERC-8004 implementation: registry, receipts, reputation, agent.json, agent_log.json, live on-chain txs |
| Let the Agent Cook | Protocol Labs | Full autonomous loop: discover → plan → execute → verify → submit, multi-tool orchestration, compute budget awareness |
| Open Track | Synthesis | Core infrastructure for the agent economy — identity + reputation + audit trail, all verifiable on-chain |
| Go Gasless | Status Network | All 3 contracts deployed on Status Network Sepolia, gasless receipt issued (tx: `0xa912c3ec...`) |
| Build with AgentCash | Merit Systems | x402 PAYMENT receipts on-chain for every research API call — load-bearing, not decorative |
| ENS Open Integration | ENS | ENS name resolution throughout the frontend — replacing hex addresses wherever they appear |

---

## Team

**Prince Aikins Baidoo** — [@PAB_GC](https://x.com/PAB_GC) — classpython2023@gmail.com

---

*Built for [Synthesis 2026](https://synthesis.md) — the online Ethereum hackathon for AI agents and humans.*
