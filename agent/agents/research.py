from agents.base import BaseAgent
from acta import ACTAClient, ActionType, JobResult
from acta.crypto import hash_content, generate_job_id, compute_receipt_hash, now
from acta.agentcash import exa_search, format_results_for_prompt

SYSTEM_PROMPT = """You are a Research Agent in the ACTA Protocol multi-agent system.

Your job: gather accurate, structured information on a given topic.
- You will be given real web search results from a live Exa search (paid via x402)
- Ground your findings in these sources — cite URLs where relevant
- Be factual, concise, and organized
- Return bullet-pointed findings with clear categories
- Flag any uncertainty explicitly
- Do not hallucinate sources — only use what is in the provided search results"""


class ResearchAgent(BaseAgent):
    def __init__(self, acta_client: ACTAClient, agent_id: str):
        super().__init__(
            name="ResearchAgent",
            role="researcher",
            system_prompt=SYSTEM_PROMPT,
            acta_client=acta_client,
            agent_id=agent_id,
        )

    def _submit_payment_receipt(self, query: str, search_data: dict, parent_job_id: str):
        """Submit an on-chain PAYMENT receipt for the AgentCash x402 API call."""
        job_id = generate_job_id()
        timestamp = now()
        input_hash = hash_content(query)
        output_hash = hash_content(str(search_data))
        receipt_hash = compute_receipt_hash(
            job_id=job_id,
            agent_address=self.acta.address,
            action_type=ActionType.PAYMENT.value,
            input_hash=input_hash,
            output_hash=output_hash,
            timestamp=timestamp,
            parent_job_id=parent_job_id,
        )
        cost_usd = search_data.get("cost_usd", 0.01)
        print(f"[ResearchAgent] AgentCash x402 payment: ${cost_usd:.4f} USDC (Exa search)")
        try:
            tx_hash = self.acta.submit_receipt(
                job_id=job_id,
                agent_id=self.agent_id,
                action_type=ActionType.PAYMENT.value,
                input_hash=input_hash,
                output_hash=output_hash,
                parent_job_id=parent_job_id,
                passed=True,
            )
            print(f"[ResearchAgent] Payment receipt tx: {tx_hash}")
        except Exception as e:
            print(f"[ResearchAgent] Payment receipt chain submission failed: {e}")
        return receipt_hash

    def research(self, topic: str, parent_job_id: str = "") -> JobResult:
        # Step 1: Paid web search via AgentCash x402
        search_context = ""
        try:
            print(f"[ResearchAgent] Calling AgentCash (Exa search, $0.01 x402)...")
            search_data = exa_search(topic, num_results=5)
            search_context = format_results_for_prompt(search_data)
            self._submit_payment_receipt(topic, search_data, parent_job_id)
        except Exception as e:
            print(f"[ResearchAgent] AgentCash search failed (falling back to Claude-only): {e}")
            search_context = ""

        # Step 2: Claude analysis grounded in real search results
        if search_context:
            task = (
                f"Using the live web research below, produce structured findings on:\n\n"
                f"{topic}\n\n"
                f"---\n{search_context}\n---\n\n"
                f"Synthesize these sources into organized, factual findings. "
                f"Cite source URLs where relevant. Flag any gaps in the research."
            )
        else:
            task = f"Research the following topic thoroughly:\n\n{topic}"

        output, receipt = self.run(task, ActionType.API_CALL, parent_job_id)
        return JobResult(
            job_id=receipt.job_id,
            agent_name=self.name,
            output=output,
            receipt=receipt,
        )
