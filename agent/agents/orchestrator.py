from agents.base import BaseAgent
from agents.research import ResearchAgent
from agents.writer import WriterAgent
from agents.verifier import VerifierAgent
from acta import ACTAClient, ActionType, JobResult

SYSTEM_PROMPT = """You are the Orchestrator Agent in the ACTA Protocol multi-agent system.

Your job: decompose a human goal into a research topic and writing goal, then coordinate specialist agents.
- Keep your decomposition clear and specific
- The research agent needs a focused topic
- The writing agent needs a clear output goal
- You are responsible for the final quality"""


class OrchestratorAgent(BaseAgent):
    def __init__(
        self,
        acta_client: ACTAClient,
        agent_id: str,
        research_agent: ResearchAgent,
        writer_agent: WriterAgent,
        verifier_agent: VerifierAgent,
    ):
        super().__init__(
            name="OrchestratorAgent",
            role="orchestrator",
            system_prompt=SYSTEM_PROMPT,
            acta_client=acta_client,
            agent_id=agent_id,
        )
        self.research = research_agent
        self.writer = writer_agent
        self.verifier = verifier_agent

    def run_pipeline(self, human_goal: str) -> JobResult:
        print(f"\n{'='*60}")
        print(f"ACTA Protocol — Multi-Agent Pipeline")
        print(f"Goal: {human_goal}")
        print(f"{'='*60}")

        # Step 1: Orchestrator plans
        plan_task = f"""Human goal: {human_goal}

Decompose this into:
1. A specific research topic for the Research Agent
2. A clear writing goal for the Writer Agent

Format your response as:
RESEARCH_TOPIC: <topic>
WRITING_GOAL: <goal>"""

        plan_output, plan_receipt = self.run(plan_task, ActionType.DECISION)
        orchestrator_job_id = plan_receipt.job_id

        # Parse plan
        research_topic = human_goal
        writing_goal = human_goal
        for line in plan_output.split("\n"):
            if line.startswith("RESEARCH_TOPIC:"):
                research_topic = line.replace("RESEARCH_TOPIC:", "").strip()
            elif line.startswith("WRITING_GOAL:"):
                writing_goal = line.replace("WRITING_GOAL:", "").strip()

        print(f"\n[Orchestrator] Research topic: {research_topic}")
        print(f"[Orchestrator] Writing goal: {writing_goal}")

        # Step 2: Research
        research_result = self.research.research(research_topic, orchestrator_job_id)

        # Step 3: Write
        writer_result = self.writer.write(
            research_result.output, writing_goal, orchestrator_job_id
        )

        # Step 4: Verify
        verifier_result, passed = self.verifier.verify(
            original_goal=human_goal,
            research_output=research_result.output,
            document=writer_result.output,
            parent_job_id=orchestrator_job_id,
        )

        verdict = "PASSED" if passed else "FAILED"
        print(f"\n[Orchestrator] Verification: {verdict}")

        return JobResult(
            job_id=orchestrator_job_id,
            agent_name=self.name,
            output=writer_result.output if passed else f"[VERIFICATION FAILED]\n{verifier_result.output}",
            receipt=plan_receipt,
            sub_results=[research_result, writer_result, verifier_result],
        )
