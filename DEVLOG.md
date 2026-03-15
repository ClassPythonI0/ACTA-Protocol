# ACTA Protocol — Dev Log
### Synthesis 2026 · Build Journal

---

## Why We Built This

The question we kept coming back to: *what does it actually mean to trust an AI agent?*

Not trust in the abstract — trust in the sense of "I am willing to let this agent call APIs, sign transactions, and produce outputs that real humans will act on." That kind of trust requires evidence. History. Proof.

Today, none of that exists in any standard form. You hire an agent and you get a black box. If it goes wrong, there is no receipt. No record. No way to know what happened.

> **"There is no Carfax for AI agents."**

That sentence became the project.

---

## Week 1 — Contracts

The first decision was architectural: what are the minimum primitives a trust layer needs?

We landed on three contracts and four pillars:

**`AgentRegistry`** — Identity
Every agent gets a unique on-chain ID, a human-readable name, a model identifier, and a signed capability manifest. No two agents can share a name. Registration is permanent and immutable.

**`ReceiptRegistry`** — Audit Trail
Every action an agent takes produces a cryptographic receipt — hashed inputs, hashed outputs, action type, timestamp, parent-linked to the previous receipt in the job chain. The full chain of custody from delegation to delivery, permanently on-chain.

ActionTypes we designed for: `DELEGATION, API_CALL, PAYMENT, OUTPUT, VERIFICATION, AGREEMENT`.

**`ReputationEngine`** — Reputation
Scores start at 500/1000 (neutral). +10 per verified pass, -20 per failure. No platform can alter or delete a score. The record is permanent.

All three deployed to Base Sepolia before Day 4.

---

## Week 1 — Agent Runtime

Contracts alone prove nothing without agents actually using them. We built a 4-agent Python pipeline powered by Claude Opus 4.6:

```
Orchestrator → Research → Writer → Verifier
```

Each agent:
1. Receives a task from Claude with adaptive thinking enabled
2. Hashes its input and output locally (SHA256)
3. Submits a receipt to `ReceiptRegistry` on-chain
4. Gets its reputation updated in `ReputationEngine`

The Verifier checks the Writer's output against the Researcher's sources. If the Writer fabricated a claim the Researcher didn't surface, the Verifier fails it — and reputation drops for both.

We ran this on ourselves first. The Verifier caught a truncated Writer output on the first real run. ACTA working as designed, in production, on its own pipeline.

---

## Week 1 — Frontend

A trust infrastructure that nobody can read isn't trustworthy. We built a Next.js frontend that reads live from Base Sepolia — no database, no indexer, no intermediary:

- `/registry` — all registered agents, their capabilities and reputation scores
- `/reputation` — live leaderboard, updated every 60 seconds
- `/receipts` — full audit trail, every receipt for every agent action

Live at [synthesis-tan.vercel.app](https://synthesis-tan.vercel.app).

---

## Week 2 — Hardening

### Protocol Labs Compliance
Added `agent.json` (ERC-8004 capability manifest) and `agent_log.json` (structured execution log) — making the autonomous decision loop machine-readable and independently verifiable.

### Status Network
Deployed ACTA contracts to Status Network Sepolia — a chain where gas is literally set to 0 at the protocol level. This changes the economics of accountability: if submitting a receipt costs nothing, there is no reason not to record everything. Granular audit trails become viable at any scale.

### AgentCash — The PAYMENT Receipt
Integrated AgentCash (Merit Systems' x402 pay-per-request layer) into the Research agent. When the agent pays for a data API during a research task, that payment generates a `PAYMENT` receipt in `ReceiptRegistry`.

This was always the plan — we designed the `PAYMENT` action type into the contract from Day 1. AgentCash made it real.

The result: a complete financial audit trail. Not just *what the agent did*, but *what the agent paid for*. Every API call, permanently on-chain, linked to the job that required it.

### Self Protocol — Human-Verified Agents
Integrated Self Protocol's ZK-powered agent identity. Agents registered with a Self attestation display a "Human-Verified" badge in the frontend.

This closes the Sybil attack vector on behavioral reputation systems: you cannot farm reputation with puppet agents if each agent requires a ZK-verified human behind it.

The full trust stack now looks like this:

| Layer | What it proves |
|-------|---------------|
| `AgentRegistry` | This agent exists with these capabilities |
| `ReputationEngine` | This agent has done good work N times |
| `ReceiptRegistry` | Here is proof of every specific action |
| Self Protocol | A real human stands behind this agent |

---

## What We Learned

**Receipts first, everything else follows.**
Design the accountability primitive before the functionality. Every feature we added — reputation, verification, payment trails — fell naturally out of the receipt structure. Teams that bolt on accountability after the fact are fighting their own architecture.

**The recursive moment.**
Using Claude Opus 4.6 to build trust infrastructure for Claude-powered agents — and having the Verifier agent catch errors in the Writer agent's output during our own build — was the clearest possible demonstration that ACTA works. The system proved itself on itself.

**Gasless accountability.**
The assumption that on-chain audit trails are too expensive to be granular is wrong on a gas=0 chain. Status Network showed that the economic objection to comprehensive receipts is a network choice, not a fundamental constraint.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Network | Base Sepolia (primary), Status Network Sepolia |
| Smart Contracts | Solidity ^0.8.24, Hardhat 2.22.17 |
| Agent Runtime | Python 3.11+, Claude Opus 4.6, web3.py |
| Payments | AgentCash (x402), Merit Systems |
| Identity | Self Protocol (ZK agent attestation) |
| Frontend | Next.js 16, Tailwind CSS, viem |
| Deployment | Vercel |

---

## GitHub

[github.com/ClassPythonI0/ACTA-Protocol](https://github.com/ClassPythonI0/ACTA-Protocol)

---

*Prince Aikins Baidoo · [@PAB_GC](https://x.com/PAB_GC) · Synthesis 2026*
