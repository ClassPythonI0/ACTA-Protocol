# ACTA Protocol
### Agent Cryptographic Trust Architecture

> A blockchain-based infrastructure for AI agent identity, provenance, and verifiable receipts.
> Every agent action — payments, API calls, agreements, and decisions — produces a cryptographic receipt recorded on-chain, enabling auditable AI behavior and trustless coordination between agents.
> Privacy is not an afterthought. Receipts prove behavior without exposing it — the human controls what is shared, with whom, and when.

**Hackathon:** The Synthesis 2026 &nbsp;|&nbsp; **Chain:** Base Mainnet &nbsp;|&nbsp; **Dates:** March 13 – March 22, 2026
**Builder:** Prince Aikins Baidoo &nbsp;|&nbsp; `@PAB_GC` &nbsp;|&nbsp; `classpython2023@gmail.com`
**Agent:** Claude Code (claude-sonnet-4-6)

---

## The Problem

> *"There is no Carfax for AI agents.*
>
> *You can't check an agent's history before you hire it. You can't tell when it starts behaving differently. And when it breaks something, you can't prove what happened.*
>
> *Every developer who has built a multi-agent system has lived this: something goes wrong, the output is broken, and the logs are scattered across three services, if they exist at all. You can't tell which agent drifted, which dependency changed quietly, or which decision in the chain caused the failure. Debugging is guesswork. Hiring is blind faith.*
>
> *This used to be an inconvenience. It's becoming a crisis.*
>
> *AI agent usage grew 10x in 2025. Autonomous agents are already managing wallets, executing transactions, and making commitments on behalf of real people with real money. The infrastructure they run on was built for humans. What accountability exists lives in private logs, behind platform walls, controlled by the same services the agent depends on.*
>
> *We're building the infrastructure: verifiable identity so agents can be found, reputation so they can be trusted, and an audit trail so they can be held accountable."*

---

## The Solution

ACTA Protocol is a four-pillar trust infrastructure for AI agents, deployed on Base Mainnet.

```
┌──────────────┬─────────────────┬──────────────┬─────────────────┐
│   IDENTITY   │   REPUTATION    │ AUDIT TRAIL  │    PRIVACY      │
│              │                 │              │                 │
│ Who is this  │ What have they  │ What did     │ Prove behavior  │
│ agent?       │ done?           │ they do here?│ without         │
│              │                 │              │ exposing it     │
│ On-chain ID  │ Attestations    │ Cryptographic│ Encrypted       │
│ ENS name     │ earned through  │ receipts per │ receipts,       │
│ ERC-8004     │ real behavior   │ action       │ owner-controlled│
└──────────────┴─────────────────┴──────────────┴─────────────────┘
```

---

## The Four Pillars

### Pillar 1 — Identity
**What it solves:** Zero-trust hiring problem. You can't hire what you can't identify.

Every agent registered on ACTA gets:
- An **ERC-8004 on-chain identity** on Base Mainnet
- A human-readable **ENS name** (e.g. `research-agent.acta.eth`)
- A signed **capability manifest** — what the agent claims it can do
- A **public registry entry** — discoverable by other agents and developers

This gives every agent a permanent, verifiable identity that travels with them across platforms.

---

### Pillar 2 — Reputation
**What it solves:** The silent API drift problem. You can't trust what you can't verify over time.

Every completed job writes an **attestation on-chain** via Talent Protocol:
- Task type and scope
- Delivery accuracy score (verified, not self-reported)
- Response consistency over time
- Policy compliance (did the agent stay within its defined boundaries?)

Attestations accumulate into an **on-chain reputation score** — earned through real behavior, owned by the agent, portable across any platform that reads the chain.

Agents with stronger reputation scores surface higher in the ACTA registry. Bad behavior is permanently recorded.

---

### Pillar 3 — Audit Trail
**What it solves:** The "who broke it" problem. You can't debug what was never recorded.

Every agent action produces a **cryptographic receipt** stored on-chain:
- Action type (API call, payment, decision, delegation)
- Input scope (what the agent was instructed to do)
- Output hash (what it actually did)
- Timestamp and gas trace
- Parent job reference (so the full chain of delegation is traceable)

Receipts are **immutable, tamper-proof, and human-readable** — a developer or a non-technical user can pull the full action log for any job and see exactly what happened, in order, with proof.

---

### Pillar 4 — Privacy
**What it solves:** Accountability without exposure. Transparency is not the same as surveillance.

Every receipt on ACTA has two layers:

```
PUBLIC LAYER                      PRIVATE LAYER
─────────────────────────────     ──────────────────────────────
Proof the receipt exists          The actual action details
The outcome hash                  API call parameters
The attestation result            Payment amounts
The agent identity                Input and output content
The timestamp                     Delegation specifics
```

- **Receipts are encrypted** with the owner's key via **Lit Protocol** — only the owner reads the details, but the proof is permanently on-chain
- **Zero-knowledge attestations** via **Self Protocol** — prove an agent completed a task correctly without revealing what the task was
- **Owner-controlled disclosure** — you choose what to share with a hiring agent, an auditor, or a judge
- **Hashes, not content** — what goes on-chain is a fingerprint of the action, not the action itself

Privacy is not a stretch goal. It is the difference between a trust tool and a surveillance tool.

---

## Synthesis Theme Alignment

| Synthesis Theme | ACTA Component | How It Maps |
|-----------------|---------------|-------------|
| **Agents that Trust** | Identity + Reputation | On-chain identity and attestations replace assumed trust |
| **Agents that Pay** | Audit Trail | Every payment produces a cryptographic receipt |
| **Agents that Cooperate** | Reputation + Receipts | Agents hire each other based on verified track records |
| **Agents that Keep Secrets** | Privacy Layer | Encrypted receipts via Lit Protocol + ZK attestations via Self Protocol — prove behavior without exposing it |

---

## Partner Integrations

| Partner | Role in ACTA |
|---------|-------------|
| **Base Mainnet** | Primary deployment chain for all contracts and receipts |
| **ENS** | Human-readable agent names and discovery |
| **Talent Protocol** | On-chain attestation layer for reputation scores |
| **Olas** | Agent infrastructure and coordination primitives |
| **Lit Protocol** | Encrypted receipt storage, owner-controlled decryption |
| **Self Protocol** | Zero-knowledge attestations for private task verification |
| **Uniswap** | Value movement for agents that pay during jobs |
| **Filecoin** | Long-term storage for full audit log archives |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity on Base Mainnet |
| Agent Runtime | Python (FastAPI) |
| On-chain Identity | ERC-8004 |
| Attestations | Talent Protocol SDK |
| Agent Names | ENS |
| Receipt Storage | Base + Filecoin |
| Encryption | Lit Protocol |
| ZK Attestations | Self Protocol |
| LLM | Claude (claude-sonnet-4-6) via Anthropic API |
| Orchestration | Claude Code |

---

## Build Plan — 10 Days

```
Day 1–2   │ IDENTITY
          │ Deploy ERC-8004 agent registry on Base
          │ ENS name registration for agents
          │ Capability manifest schema + signing

Day 3–4   │ AUDIT TRAIL
          │ Receipt smart contract (action → on-chain hash)
          │ Python SDK: wrap any agent action to produce a receipt
          │ Human-readable receipt viewer

Day 5–6   │ REPUTATION
          │ Talent Protocol attestation integration
          │ Scoring logic: delivery, consistency, compliance
          │ Registry surfacing agents by reputation score

Day 6–7   │ PRIVACY LAYER
          │ Lit Protocol: encrypt receipts, owner-controlled keys
          │ Self Protocol: ZK attestations for private task verification
          │ Public/private receipt separation

Day 8     │ INTEGRATION + DEMO
          │ 4-agent demo: Orchestrator → Research + Writer → Verifier
          │ Full job run: receipts written, attestations issued
          │ Audit trail pulled and verified on-chain

Day 9     │ FRONTEND
          │ Next.js + Tailwind + shadcn/ui
          │ Agent registry (ENS names + reputation scores)
          │ Receipt viewer (full audit trail per job)
          │ Privacy toggle (public vs encrypted layers)
          │ Wallet connect on Base Mainnet

Day 10    │ SUBMISSION
          │ Polish frontend + record demo video
          │ Open-source repo published
          │ Conversation log documented
          │ On-chain artifacts verified on Basescan
```

---

## What the Demo Looks Like

**The scenario:** A human asks for a research report on a topic. Four agents handle it.

```
Human
  │ "Research and write a report on AI agent adoption in 2025"
  ↓
Orchestrator Agent  (orchestrator.acta.eth)
  │ Breaks goal into tasks. Checks ACTA registry for available specialists.
  │ Hires by reputation score. Writes delegation receipts on-chain.
  ↓                              ↓
Research Agent             Writer Agent
(researcher.acta.eth)      (writer.acta.eth)
  │ Makes API calls.           │ Receives research output.
  │ Every call = receipt.      │ Produces draft report.
  │ Delivers data.             │ Every output = receipt.
  ↓                              ↓
                    Verifier Agent  (verifier.acta.eth)
                      │ Checks output quality against original scope.
                      │ Pass or fail — either way, receipt written.
                      ↓
                    Human receives final report
```

**What ACTA produces from this single job:**

- 4 on-chain agent identities with ENS names
- 1 orchestration receipt (delegation decisions)
- 4+ research receipts (each API call logged)
- 2 writer receipts (draft + revision)
- 1 verifier receipt (pass/fail with scope reference)
- 4 reputation attestations updated via Talent Protocol
- All content encrypted via Lit Protocol — only the human reads the details

**The audit trail in action:**

> *The final report is wrong. The human opens the ACTA receipt viewer.*
> *The verifier passed it — that's on-chain. The writer's output hash doesn't match the research data hash.*
> *The Research Agent made an API call that returned stale data — receipt timestamp proves it.*
> *Root cause found in 10 seconds. No guessing. No scattered logs. Just the chain."*

---

## On-Chain Artifacts

By submission day, ACTA will have produced:

- Deployed **agent registry contract** on Base Mainnet
- Registered **agent identities** with ENS names
- Written **cryptographic receipts** for every demo action
- Published **reputation attestations** via Talent Protocol
- Archived **full audit logs** on Filecoin
- Encrypted receipts readable only by the owner via Lit Protocol
- ZK attestations proving task completion without revealing task content

All artifacts are verifiable on-chain. Sensitive details stay in the hands of the human who owns them.

---

> *"ACTA: so you know who you're hiring, what they've done, and exactly what they did for you — without exposing anything you didn't choose to share."*
