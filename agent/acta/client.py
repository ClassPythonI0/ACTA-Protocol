import json
import os
from pathlib import Path
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent / "contracts" / ".env")

RPC = os.getenv("BASE_SEPOLIA_RPC", "https://sepolia.base.org")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
AGENT_REGISTRY_ADDRESS = os.getenv("AGENT_REGISTRY_ADDRESS")
RECEIPT_REGISTRY_ADDRESS = os.getenv("RECEIPT_REGISTRY_ADDRESS")
REPUTATION_ENGINE_ADDRESS = os.getenv("REPUTATION_ENGINE_ADDRESS")

ARTIFACTS_DIR = Path(__file__).parent.parent.parent / "contracts" / "artifacts" / "src"


def _load_abi(contract_name: str) -> list:
    path = ARTIFACTS_DIR / f"{contract_name}.sol" / f"{contract_name}.json"
    with open(path) as f:
        return json.load(f)["abi"]


class ACTAClient:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(RPC))
        self.account = Account.from_key(PRIVATE_KEY)
        self.address = self.account.address
        self._nonce = None

        self.registry = self.w3.eth.contract(
            address=Web3.to_checksum_address(AGENT_REGISTRY_ADDRESS),
            abi=_load_abi("AgentRegistry"),
        )
        self.receipts = self.w3.eth.contract(
            address=Web3.to_checksum_address(RECEIPT_REGISTRY_ADDRESS),
            abi=_load_abi("ReceiptRegistry"),
        )
        self.reputation = self.w3.eth.contract(
            address=Web3.to_checksum_address(REPUTATION_ENGINE_ADDRESS),
            abi=_load_abi("ReputationEngine"),
        )

    def _get_nonce(self) -> int:
        confirmed = self.w3.eth.get_transaction_count(self.address, "latest")
        if self._nonce is None or confirmed > self._nonce:
            self._nonce = confirmed
        return self._nonce

    def _send_tx(self, fn):
        nonce = self._get_nonce()
        gas_price = int(self.w3.eth.gas_price * 1.2)
        tx = fn.build_transaction({
            "from": self.address,
            "nonce": nonce,
            "gas": 300_000,
            "gasPrice": gas_price,
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        self._nonce = nonce + 1
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        return receipt

    def register_agent(self, name: str, model: str, capability_hash: str, harness_type: str) -> str:
        receipt = self._send_tx(
            self.registry.functions.registerAgent(name, model, capability_hash, harness_type)
        )
        logs = self.registry.events.AgentRegistered().process_receipt(receipt)
        if logs:
            agent_id = logs[0]["args"]["agentId"].hex()
            return "0x" + agent_id
        return receipt.transactionHash.hex()

    # Map our action type strings to the contract's ActionType enum indices
    ACTION_TYPE_MAP = {
        "delegate":   0,  # DELEGATION
        "api_call":   1,  # API_CALL
        "payment":    2,  # PAYMENT
        "output":     3,  # OUTPUT
        "verify":     4,  # VERIFICATION
        "decision":   0,  # DELEGATION (orchestrator decisions = delegation)
        "agreement":  5,  # AGREEMENT
    }

    def submit_receipt(
        self,
        job_id: str,
        agent_id: str,
        action_type: str,
        input_hash: str,
        output_hash: str,
        receipt_hash: str = "",   # kept for API compat, not sent to contract
        parent_job_id: str = "",
        passed: bool = True,
        encrypted_cid: str = "",
    ) -> str:
        def to_bytes32(hex_str: str) -> bytes:
            clean = hex_str.replace("-", "").replace("0x", "")
            return bytes.fromhex(clean.ljust(64, "0")[:64])

        job_id_b      = to_bytes32(job_id)
        agent_id_b    = to_bytes32(agent_id)
        parent_b      = to_bytes32(parent_job_id) if parent_job_id else b"\x00" * 32
        input_b       = to_bytes32(input_hash)
        output_b      = to_bytes32(output_hash)
        action_enum   = self.ACTION_TYPE_MAP.get(action_type, 0)

        tx_receipt = self._send_tx(
            self.receipts.functions.issueReceipt(
                job_id_b,
                parent_b,
                agent_id_b,
                action_enum,
                input_b,
                output_b,
                encrypted_cid,
                passed,
            )
        )
        return tx_receipt.transactionHash.hex()

    def initialize_agent_reputation(self, agent_id: str) -> str:
        agent_id_b = bytes.fromhex(agent_id.lstrip("0x").ljust(64, "0")[:64])
        tx = self._send_tx(self.reputation.functions.initializeAgent(agent_id_b))
        return tx.transactionHash.hex()

    def record_outcome(self, agent_id: str, passed: bool) -> str:
        agent_id_b = bytes.fromhex(agent_id.lstrip("0x").ljust(64, "0")[:64])
        tx = self._send_tx(self.reputation.functions.recordOutcome(agent_id_b, passed))
        return tx.transactionHash.hex()

    def get_reputation(self, agent_id: str) -> dict:
        agent_id_b = bytes.fromhex(agent_id.lstrip("0x").ljust(64, "0")[:64])
        rec = self.reputation.functions.getReputation(agent_id_b).call()
        return {
            "score":       rec[0],
            "totalJobs":   rec[1],
            "passedJobs":  rec[2],
            "failedJobs":  rec[3],
            "lastUpdated": rec[4],
        }

    def connected(self) -> bool:
        return self.w3.is_connected()
