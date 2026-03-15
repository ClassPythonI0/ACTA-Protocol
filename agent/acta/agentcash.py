"""
AgentCash x402 integration for ACTA Protocol.

Each call to this module:
  1. Makes a real paid API request via x402 micropayment (USDC on Base)
  2. Returns structured results the Research agent can use
  3. Caller is responsible for submitting the PAYMENT receipt on-chain

Cost: $0.01 per Exa search call
"""
import subprocess
import json


def exa_search(query: str, num_results: int = 5) -> dict:
    """
    Search the web via Exa (stableenrich.dev) using AgentCash x402 payment.

    Payment: $0.01 USDC on Base, settled automatically via x402 protocol.
    Returns dict with 'results' list and 'cost_usd' float.
    Raises RuntimeError on failure (no charge on failed requests).
    """
    body = json.dumps({
        "query": query,
        "numResults": num_results,
        "type": "auto",
        "contents": {
            "text": {"maxCharacters": 2000},
            "highlights": {
                "numSentences": 3,
                "highlightsPerUrl": 3,
                "query": query,
            },
        },
    })

    result = subprocess.run(
        [
            "npx", "agentcash@latest", "fetch",
            "https://stableenrich.dev/api/exa/search",
            "-m", "POST",
            "-b", body,
            "--format", "json",
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=60,
        shell=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"AgentCash Exa search failed: {result.stderr.strip()}")

    data = json.loads(result.stdout)
    results = data.get("results", [])

    return {
        "query": query,
        "results": results,
        "cost_usd": data.get("costDollars", {}).get("total", 0.01),
        "num_results": len(results),
    }


def format_results_for_prompt(search_data: dict) -> str:
    """Format Exa search results into a structured block for the Claude prompt."""
    lines = [
        f"## Live Web Research — Exa Search (x402 paid, ${search_data['cost_usd']:.4f} USDC)",
        f"Query: \"{search_data['query']}\"",
        f"Results: {search_data['num_results']} sources\n",
    ]

    for i, r in enumerate(search_data["results"], 1):
        lines.append(f"### Source {i}: {r.get('title', 'Untitled')}")
        lines.append(f"URL: {r.get('url', '')}")
        if r.get("publishedDate"):
            lines.append(f"Published: {r['publishedDate']}")
        if r.get("highlights"):
            lines.append("Key excerpts:")
            for h in r["highlights"][:3]:
                lines.append(f"  - {h.strip()}")
        if r.get("text"):
            lines.append(f"Content: {r['text'][:800].strip()}...")
        lines.append("")

    return "\n".join(lines)
