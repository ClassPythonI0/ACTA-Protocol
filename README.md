# ACTA Protocol — Agent Cryptographic Trust Architecture

> **Synthesis 2026 Hackathon submission** — trust infrastructure for autonomous AI agents on Ethereum.

---

## The Problem

There is no Carfax for AI agents.

Hiring an autonomous agent today means trusting a black box. No verifiable history, no audit trail, no accountability. If an agent makes a wrong call — a bad trade, a hallucinated output, an unauthorized payment — you have no on-chain record proving what happened, who instructed it, or whether anyone checked its work.

The accountability layer for AI agents was never built.

---

## What ACTA Builds

ACTA Protocol is a four-pillar trust infrastructure layer for autonomous agents:

| Pillar | Contract | What it does |
|--------|----------|-------------|
| **01 Identity** | `AgentRegistry` | On-chain agent ID, capability manifest, harness type |
| **02 Reputation** | `ReputationEngine` | Permanent score updated after every verified job |
| **03 Audit Trail** | `ReceiptRegistry` | Cryptographic receipt for every agent action |
| **04 Privacy** | Lit Protocol *(pending)* | Encrypted receipt content — privacy-preserving accountability |

---

## Deployed Contracts — Base Sepolia

| Contract | Address |
|----------|---------|
| `AgentRegistry` | [`0xcd454b704FED5744893874D70DE1A3F3C0858407`](https://sepolia.basescan.org/address/0xcd454b704FED5744893874D70DE1A3F3C0858407) |
| `ReceiptRegistry` | [`0x7FbC5257a73b51Fd01859cd50C7A1eAA5E476EA1`](https://sepolia.basescan.org/address/0x7FbC5257a73b51Fd01859cd50C7A1eAA5E476EA1) |
| `ReputationEngine` | [`0x82A335CC0a1F6c7636F9ab47c5C55c7c53684737`](https://sepolia.basescan.org/address/0x82A335CC0a1F6c7636F9ab47c5C55c7c53684737) |

---

## Repo Structure

```
.
├── contracts/              Hardhat project — Solidity smart contracts
│   ├── src/
│   │   ├── AgentRegistry.sol
│   │   ├── ReceiptRegistry.sol
│   │   └── ReputationEngine.sol
│   ├── script/deploy.js
│   ├── test/
│   └── deployments/baseSepolia.json
│
├── agent/                  Python multi-agent runtime
│   ├── acta/
│   │   ├── client.py       Web3 client — reads/writes all 3 contracts
│   │   ├── crypto.py       SHA256 hashing, receipt hash, job ID generation
│   │   └── models.py       Pydantic models (Receipt, JobResult, ActionType)
│   ├── agents/
│   │   ├── base.py         BaseAgent — Claude call + on-chain receipt submission
│   │   ├── orchestrator.py Plans, delegates, coordinates
│   │   ├── research.py     Deep-research specialist
│   │   ├── writer.py       Structured report writer
│   │   └── verifier.py     Fact-checks writer output, emits PASS/FAIL
│   ├── main.py             Entry point — task menu, agent registration, pipeline
│   └── requirements.txt
│
└── frontend/               Next.js 16 + Tailwind — live chain explorer
    ├── app/
    │   ├── page.tsx         Dashboard + pillar explainers
    │   ├── registry/        Agent Registry viewer
    │   ├── reputation/      Leaderboard — live scores
    │   └── receipts/        Audit trail — all agent receipts
    └── lib/
        ├── contracts.ts     ABIs + deployed addresses
        └── client.ts        viem public client (Base Sepolia)
```

---

## How It Works

1. **Register** — Each agent registers on `AgentRegistry`, receiving a unique `agentId` and a signed capability manifest.

2. **Run** — The Orchestrator delegates tasks to Research, Writer, and Verifier agents powered by Claude Opus 4.6 with adaptive thinking.

3. **Receipt** — Every action (delegation, API call, written output, verification) issues a cryptographic receipt to `ReceiptRegistry`: hashed inputs/outputs, action type, pass/fail, parent-linked for chain-of-custody tracing.

4. **Reputation** — The Verifier's PASS/FAIL verdict updates the agent's permanent score in `ReputationEngine` (+10 pass, -20 fail, starts at 500/1000).

5. **Explore** — The frontend reads all of this live from the chain — no database, no indexer, no trust-me-bro.

---

## Running Locally

### Prerequisites

- Node 20+ and Python 3.11+
- A Base Sepolia RPC URL and funded wallet
- Anthropic API key

### 1. Smart Contracts

```bash
cd contracts
cp .env.example .env        # fill in PRIVATE_KEY, BASE_SEPOLIA_RPC, BASESCAN_API_KEY
npm install --legacy-peer-deps
npx hardhat run script/deploy.js --network baseSepolia
```

### 2. Python Agent Runtime

```bash
cd agent
pip install -r requirements.txt

# Add to contracts/.env:
# ANTHROPIC_API_KEY=sk-ant-...
# AGENT_REGISTRY_ADDRESS=0x...
# RECEIPT_REGISTRY_ADDRESS=0x...
# REPUTATION_ENGINE_ADDRESS=0x...

python main.py              # interactive task menu
python main.py 3            # jump to task 3
python main.py "custom goal here"
```

**Available tasks:**

| # | Task |
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
| L2 Network | Base Sepolia (Ethereum L2) |
| Smart Contracts | Solidity ^0.8.24, Hardhat 2.22.17 |
| Agent Runtime | Python 3.11+, Claude Opus 4.6, web3.py, Pydantic |
| Chain Client (frontend) | viem, Next.js 16, Tailwind CSS |
| Privacy Layer | Lit Protocol *(planned)* |

---

## Team

**Prince Aikins Baidoo** — [@PAB_GC](https://x.com/PAB_GC) — classpython2023@gmail.com

---

*Built for [Synthesis 2026](https://synthesis.md) — the online Ethereum hackathon for AI agents and humans.*
