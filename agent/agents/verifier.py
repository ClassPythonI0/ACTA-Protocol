from agents.base import BaseAgent
from acta import ACTAClient, ActionType, JobResult

SYSTEM_PROMPT = """You are a Verifier Agent in the ACTA Protocol multi-agent system.

Your job: critically evaluate a document against the original goal and source research.
- Check: does the document address the original goal?
- Check: are all claims grounded in the research provided?
- Check: is anything missing, fabricated, or misleading?
- Return a structured verdict: PASS or FAIL with specific reasons
- Be strict — your job is quality control, not encouragement"""


class VerifierAgent(BaseAgent):
    def __init__(self, acta_client: ACTAClient, agent_id: str):
        super().__init__(
            name="VerifierAgent",
            role="verifier",
            system_prompt=SYSTEM_PROMPT,
            acta_client=acta_client,
            agent_id=agent_id,
        )

    def verify(
        self,
        original_goal: str,
        research_output: str,
        document: str,
        parent_job_id: str = "",
    ) -> JobResult:
        research_section = f"\nSource research provided:\n{research_output}" if research_output else "\nNote: No source research provided — verify only against original goal."
        task = f"""Original goal: {original_goal}
{research_section}

Document to verify:
{document}

Verify the document against the goal and research. Return PASS or FAIL with reasons.
Note: Minor truncation is acceptable if all core sections are addressed. Focus on substance."""
        output, receipt = self.run(task, ActionType.VERIFY, parent_job_id)
        passed = "PASS" in output.upper()
        return JobResult(
            job_id=receipt.job_id,
            agent_name=self.name,
            output=output,
            receipt=receipt,
        ), passed
