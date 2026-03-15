import hashlib
import json
import time
import uuid


def hash_content(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()


def generate_job_id() -> str:
    return str(uuid.uuid4())


def compute_receipt_hash(
    job_id: str,
    agent_address: str,
    action_type: str,
    input_hash: str,
    output_hash: str,
    timestamp: int,
    parent_job_id: str = "",
) -> str:
    payload = json.dumps({
        "job_id": job_id,
        "agent_address": agent_address,
        "action_type": action_type,
        "input_hash": input_hash,
        "output_hash": output_hash,
        "timestamp": timestamp,
        "parent_job_id": parent_job_id,
    }, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def now() -> int:
    return int(time.time())
