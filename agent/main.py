import sys
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "contracts" / ".env")

from acta import ACTAClient
from agents import OrchestratorAgent, ResearchAgent, WriterAgent, VerifierAgent

AGENT_IDS_FILE = Path(__file__).parent / "agent_ids.json"


def register_agents(acta: ACTAClient) -> dict:
    if AGENT_IDS_FILE.exists():
        with open(AGENT_IDS_FILE) as f:
            ids = json.load(f)
        print("Agent identities loaded from cache.")
        return ids

    print("\nRegistering agents on-chain...")
    ids = {}
    agents_to_register = [
        ("OrchestratorAgent", "claude-opus-4-6", "orchestrate|delegate|plan", "claude-code"),
        ("ResearchAgent",     "claude-opus-4-6", "research|retrieve|summarize", "claude-code"),
        ("WriterAgent",       "claude-opus-4-6", "write|structure|compose",    "claude-code"),
        ("VerifierAgent",     "claude-opus-4-6", "verify|validate|audit",      "claude-code"),
    ]
    for name, model, capability_hash, harness_type in agents_to_register:
        print(f"  Registering {name}...")
        agent_id = acta.register_agent(name, model, capability_hash, harness_type)
        ids[name] = agent_id
        print(f"  {name} → {agent_id}")
        print(f"  Initializing reputation...")
        acta.initialize_agent_reputation(agent_id)

    with open(AGENT_IDS_FILE, "w") as f:
        json.dump(ids, f, indent=2)
    print("Agent IDs saved.")
    return ids


def print_audit_trail(result, depth=0):
    indent = "  " * depth
    r = result.receipt
    print(f"{indent}┌─ {result.agent_name}")
    print(f"{indent}│  job_id:       {r.job_id}")
    print(f"{indent}│  action:       {r.action_type.value}")
    print(f"{indent}│  receipt_hash: {r.receipt_hash[:16]}...")
    print(f"{indent}│  tx_hash:      {r.tx_hash or 'not submitted'}")
    for sub in result.sub_results:
        print(f"{indent}│")
        print_audit_trail(sub, depth + 1)
    print(f"{indent}└{'─' * 40}")


TASKS = [
    (
        "Ethereum AI Agent Infrastructure Gap",
        "Explain the current state of AI agent infrastructure on Ethereum "
        "and what is missing for agents to operate autonomously and safely."
    ),
    (
        "On-Chain Reputation Systems",
        "Analyze existing on-chain reputation and trust systems for AI agents — "
        "what protocols exist, what are their limitations, and what a robust "
        "reputation primitive should look like for autonomous agents in Web3."
    ),
    (
        "Agent Accountability & Audit Trails",
        "Research the problem of accountability for AI agents that take on-chain actions. "
        "What happens when an agent makes a bad decision, executes a wrong payment, or "
        "produces a harmful output? How should cryptographic audit trails be designed "
        "to support dispute resolution and post-hoc verification?"
    ),
    (
        "Hiring an AI Agent: Trust & Verification",
        "A developer wants to hire an AI agent to manage their DeFi portfolio. "
        "What information should they verify before trusting the agent? "
        "What on-chain signals exist today, and what infrastructure is still missing "
        "to make agent hiring as safe as hiring a vetted contractor?"
    ),
    (
        "Multi-Agent Coordination Risks",
        "Examine the trust and safety risks that emerge when multiple AI agents "
        "collaborate on a task — delegation chains, conflicting instructions, "
        "accountability dilution, and how ACTA-style receipts could mitigate them."
    ),
    (
        "Privacy vs. Transparency for AI Agents",
        "AI agents operating on-chain face a tension: full transparency enables "
        "accountability but exposes sensitive strategies; full privacy protects "
        "users but hides bad behavior. Research how protocols like Lit Protocol, "
        "ZK proofs, and selective disclosure can resolve this tradeoff."
    ),
    (
        "The Cost of Unverified AI Agents in DeFi",
        "Research real or plausible incidents where unverified AI agents caused "
        "financial losses in DeFi — failed automations, oracle manipulation, "
        "hallucinated transactions — and what an on-chain trust layer would have prevented."
    ),
]


def pick_task() -> str:
    if len(sys.argv) > 1:
        # Allow numeric index: python main.py 3
        arg = " ".join(sys.argv[1:])
        if arg.strip().isdigit():
            idx = int(arg.strip()) - 1
            if 0 <= idx < len(TASKS):
                title, goal = TASKS[idx]
                print(f"\nTask selected: {title}")
                return goal
        return arg  # custom goal passed directly

    print("\nSelect a pipeline task:")
    print("-" * 60)
    for i, (title, _) in enumerate(TASKS, 1):
        print(f"  [{i}] {title}")
    print(f"  [0] Enter a custom goal")
    print("-" * 60)

    choice = input("Choice (default=1): ").strip()
    if choice == "0":
        return input("Enter your goal: ").strip()
    try:
        idx = int(choice) - 1 if choice else 0
        title, goal = TASKS[idx]
        print(f"\nTask: {title}")
        return goal
    except (ValueError, IndexError):
        title, goal = TASKS[0]
        print(f"\nDefaulting to: {title}")
        return goal


def main():
    goal = pick_task()

    print("\nACTA Protocol — Agent Cryptographic Trust Architecture")
    print("=" * 60)

    acta = ACTAClient()
    if not acta.connected():
        print("ERROR: Cannot connect to Base Sepolia RPC.")
        sys.exit(1)

    print(f"Connected to Base Sepolia. Wallet: {acta.address}")

    agent_ids = register_agents(acta)

    research = ResearchAgent(acta, agent_ids["ResearchAgent"])
    writer = WriterAgent(acta, agent_ids["WriterAgent"])
    verifier = VerifierAgent(acta, agent_ids["VerifierAgent"])
    orchestrator = OrchestratorAgent(acta, agent_ids["OrchestratorAgent"], research, writer, verifier)

    result = orchestrator.run_pipeline(goal)

    print("\n" + "=" * 60)
    print("FINAL OUTPUT")
    print("=" * 60)
    print(result.output)

    print("\n" + "=" * 60)
    print("ON-CHAIN AUDIT TRAIL")
    print("=" * 60)
    print_audit_trail(result)

    print(f"\nView receipts on Basescan:")
    print(f"https://sepolia.basescan.org/address/{acta.receipts.address}")

    print("\n" + "=" * 60)
    print("AGENT REPUTATION SCORES")
    print("=" * 60)
    for name, agent_id in agent_ids.items():
        try:
            rep = acta.get_reputation(agent_id)
            pass_rate = (rep["passedJobs"] * 100 // rep["totalJobs"]) if rep["totalJobs"] > 0 else 0
            print(f"{name:<22} score={rep['score']:>4}/1000  jobs={rep['totalJobs']}  pass_rate={pass_rate}%")
        except Exception:
            print(f"{name:<22} reputation not initialized")

    print(f"\nView reputation on Basescan:")
    print(f"https://sepolia.basescan.org/address/{acta.reputation.address}")


if __name__ == "__main__":
    main()
