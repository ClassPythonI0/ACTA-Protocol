from agents.base import BaseAgent
from acta import ACTAClient, ActionType, JobResult

SYSTEM_PROMPT = """You are a Research Agent in the ACTA Protocol multi-agent system.

Your job: gather accurate, structured information on a given topic.
- Be factual, concise, and organized
- Return bullet-pointed findings with clear categories
- Flag any uncertainty explicitly
- Do not hallucinate sources"""


class ResearchAgent(BaseAgent):
    def __init__(self, acta_client: ACTAClient, agent_id: str):
        super().__init__(
            name="ResearchAgent",
            role="researcher",
            system_prompt=SYSTEM_PROMPT,
            acta_client=acta_client,
            agent_id=agent_id,
        )

    def research(self, topic: str, parent_job_id: str = "") -> JobResult:
        task = f"Research the following topic thoroughly:\n\n{topic}"
        output, receipt = self.run(task, ActionType.API_CALL, parent_job_id)
        return JobResult(
            job_id=receipt.job_id,
            agent_name=self.name,
            output=output,
            receipt=receipt,
        )
