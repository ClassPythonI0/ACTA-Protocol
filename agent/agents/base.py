import os
import anthropic
from dotenv import load_dotenv
from pathlib import Path
from acta import ACTAClient, Receipt, ActionType
from acta.crypto import hash_content, generate_job_id, compute_receipt_hash, now

load_dotenv(Path(__file__).parent.parent.parent / "contracts" / ".env")


class BaseAgent:
    def __init__(
        self,
        name: str,
        role: str,
        system_prompt: str,
        acta_client: ACTAClient,
        agent_id: str,
    ):
        self.name = name
        self.role = role
        self.system_prompt = system_prompt
        self.acta = acta_client
        self.agent_id = agent_id
        self.claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    def _call_claude(self, prompt: str) -> str:
        response = self.claude.messages.create(
            model="claude-opus-4-6",
            max_tokens=8192,
            thinking={"type": "adaptive"},
            system=self.system_prompt,
            messages=[{"role": "user", "content": prompt}],
        )
        for block in response.content:
            if block.type == "text":
                return block.text
        return ""

    def run(
        self,
        task: str,
        action_type: ActionType,
        parent_job_id: str = "",
        submit_on_chain: bool = True,
        passed: bool = True,
    ) -> tuple[str, Receipt]:
        job_id = generate_job_id()
        timestamp = now()
        input_hash = hash_content(task)

        print(f"\n[{self.name}] Running task...")
        output = self._call_claude(task)
        print(f"[{self.name}] Done.")

        output_hash = hash_content(output)
        receipt_hash = compute_receipt_hash(
            job_id=job_id,
            agent_address=self.acta.address,
            action_type=action_type.value,
            input_hash=input_hash,
            output_hash=output_hash,
            timestamp=timestamp,
            parent_job_id=parent_job_id,
        )

        tx_hash = None
        if submit_on_chain:
            try:
                print(f"[{self.name}] Submitting receipt on-chain...")
                tx_hash = self.acta.submit_receipt(
                    job_id=job_id,
                    agent_id=self.agent_id,
                    action_type=action_type.value,
                    input_hash=input_hash,
                    output_hash=output_hash,
                    parent_job_id=parent_job_id,
                    passed=passed,
                )
                print(f"[{self.name}] Receipt tx: {tx_hash}")
                self.acta.record_outcome(self.agent_id, passed)
                print(f"[{self.name}] Reputation updated.")
            except Exception as e:
                print(f"[{self.name}] Chain submission failed: {e}")

        receipt = Receipt(
            job_id=job_id,
            agent_id=self.agent_id,
            agent_address=self.acta.address,
            action_type=action_type,
            input_hash=input_hash,
            output_hash=output_hash,
            parent_job_id=parent_job_id or None,
            timestamp=timestamp,
            receipt_hash=receipt_hash,
            tx_hash=tx_hash,
        )

        return output, receipt
