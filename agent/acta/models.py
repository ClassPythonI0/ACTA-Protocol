from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ActionType(str, Enum):
    DELEGATE = "delegate"
    API_CALL = "api_call"
    PAYMENT = "payment"
    DECISION = "decision"
    OUTPUT = "output"
    VERIFY = "verify"


class Receipt(BaseModel):
    job_id: str
    agent_id: str
    agent_address: str
    action_type: ActionType
    input_hash: str
    output_hash: str
    parent_job_id: Optional[str] = None
    timestamp: int
    receipt_hash: str
    tx_hash: Optional[str] = None


class AgentIdentity(BaseModel):
    name: str
    role: str
    address: str
    agent_id: Optional[str] = None
    on_chain: bool = False


class JobResult(BaseModel):
    job_id: str
    agent_name: str
    output: str
    receipt: Receipt
    sub_results: list["JobResult"] = []
