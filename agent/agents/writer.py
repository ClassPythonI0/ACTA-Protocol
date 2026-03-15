from agents.base import BaseAgent
from acta import ACTAClient, ActionType, JobResult

SYSTEM_PROMPT = """You are a Writer Agent in the ACTA Protocol multi-agent system.

Your job: transform research findings into a clear, well-structured document.
- Write for a technical but non-specialist audience
- Use clear headings and sections
- Be concise — no filler, no padding
- Ground every claim in the research provided"""


class WriterAgent(BaseAgent):
    def __init__(self, acta_client: ACTAClient, agent_id: str):
        super().__init__(
            name="WriterAgent",
            role="writer",
            system_prompt=SYSTEM_PROMPT,
            acta_client=acta_client,
            agent_id=agent_id,
        )

    def write(self, research_output: str, original_goal: str, parent_job_id: str = "") -> JobResult:
        task = f"""Original goal: {original_goal}

Research findings:
{research_output}

Write a clear, structured document based on the research above."""
        output, receipt = self.run(task, ActionType.OUTPUT, parent_job_id)
        return JobResult(
            job_id=receipt.job_id,
            agent_name=self.name,
            output=output,
            receipt=receipt,
        )
