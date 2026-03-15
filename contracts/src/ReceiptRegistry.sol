// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ReceiptRegistry
/// @notice ACTA Protocol — Pillar 3: Audit Trail
/// @dev Every AI agent action produces a cryptographic receipt stored on-chain.
///      Receipts are immutable, parent-linked (forming a traceable chain per job),
///      and store only hashes — never raw content — to protect privacy.

contract ReceiptRegistry {

    // ─────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────

    enum ActionType {
        DELEGATION,     // Orchestrator assigned a task to a specialist
        API_CALL,       // Agent made an external API call
        PAYMENT,        // Agent executed a payment
        OUTPUT,         // Agent produced a deliverable output
        VERIFICATION,   // Verifier agent checked an output
        AGREEMENT       // Agent made a commitment or agreement
    }

    // ─────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────

    struct Receipt {
        bytes32    receiptId;       // Unique receipt ID
        bytes32    jobId;           // The job this receipt belongs to
        bytes32    parentReceiptId; // Previous receipt in the chain (0x0 if first)
        bytes32    agentId;         // Agent that produced this receipt
        ActionType actionType;      // What kind of action was taken
        bytes32    inputHash;       // Hash of the input/instruction given to the agent
        bytes32    outputHash;      // Hash of the output/result produced
        string     encryptedCID;    // Lit Protocol encrypted content CID (private layer)
        uint256    timestamp;       // Block timestamp
        bool       passed;          // For VERIFICATION receipts: did it pass?
    }

    // ─────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────

    mapping(bytes32 => Receipt)   private receipts;          // receiptId → Receipt
    mapping(bytes32 => bytes32[]) private jobReceipts;       // jobId → ordered receipt list
    mapping(bytes32 => bytes32[]) private agentReceipts;     // agentId → receipt list

    uint256 private nonce;

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    event ReceiptIssued(
        bytes32 indexed receiptId,
        bytes32 indexed jobId,
        bytes32 indexed agentId,
        ActionType      actionType,
        uint256         timestamp
    );

    // ─────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────

    error ReceiptNotFound(bytes32 receiptId);
    error InvalidHash(string field);

    // ─────────────────────────────────────────────────────────
    // Issue Receipt
    // ─────────────────────────────────────────────────────────

    /// @notice Issue a cryptographic receipt for an agent action
    /// @param jobId           The job this action belongs to
    /// @param parentReceiptId Previous receipt in the chain (bytes32(0) if first)
    /// @param agentId         The agent performing the action
    /// @param actionType      The type of action taken
    /// @param inputHash       SHA256 hash of the input given to the agent
    /// @param outputHash      SHA256 hash of the output produced
    /// @param encryptedCID    Lit Protocol CID of the encrypted full content
    /// @param passed          For VERIFICATION actions: true = pass, false = fail
    /// @return receiptId      The unique ID of the issued receipt
    function issueReceipt(
        bytes32    jobId,
        bytes32    parentReceiptId,
        bytes32    agentId,
        ActionType actionType,
        bytes32    inputHash,
        bytes32    outputHash,
        string calldata encryptedCID,
        bool       passed
    ) external returns (bytes32 receiptId) {
        if (jobId == bytes32(0))    revert InvalidHash("jobId");
        if (agentId == bytes32(0))  revert InvalidHash("agentId");
        if (inputHash == bytes32(0)) revert InvalidHash("inputHash");

        receiptId = keccak256(abi.encodePacked(jobId, agentId, nonce++, block.timestamp));

        receipts[receiptId] = Receipt({
            receiptId:       receiptId,
            jobId:           jobId,
            parentReceiptId: parentReceiptId,
            agentId:         agentId,
            actionType:      actionType,
            inputHash:       inputHash,
            outputHash:      outputHash,
            encryptedCID:    encryptedCID,
            timestamp:       block.timestamp,
            passed:          passed
        });

        jobReceipts[jobId].push(receiptId);
        agentReceipts[agentId].push(receiptId);

        emit ReceiptIssued(receiptId, jobId, agentId, actionType, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────
    // Read
    // ─────────────────────────────────────────────────────────

    /// @notice Get a receipt by ID
    function getReceipt(bytes32 receiptId) external view returns (Receipt memory) {
        if (receipts[receiptId].timestamp == 0) revert ReceiptNotFound(receiptId);
        return receipts[receiptId];
    }

    /// @notice Get all receipts for a job in order
    function getJobAuditTrail(bytes32 jobId) external view returns (bytes32[] memory) {
        return jobReceipts[jobId];
    }

    /// @notice Get all receipts issued by a specific agent
    function getAgentHistory(bytes32 agentId) external view returns (bytes32[] memory) {
        return agentReceipts[agentId];
    }

    /// @notice Verify a specific output hash matches what was recorded
    /// @dev Used to detect drift — if output changed, hashes won't match
    function verifyOutput(bytes32 receiptId, bytes32 claimedOutputHash) external view returns (bool) {
        Receipt storage r = receipts[receiptId];
        if (r.timestamp == 0) revert ReceiptNotFound(receiptId);
        return r.outputHash == claimedOutputHash;
    }

    /// @notice Get the full chain of receipts from a receipt back to the job root
    /// @dev Follows parentReceiptId links — useful for tracing a failure to its origin
    function traceChain(bytes32 receiptId) external view returns (bytes32[] memory chain) {
        // Count chain length first
        uint256 length = 0;
        bytes32 current = receiptId;
        while (current != bytes32(0) && receipts[current].timestamp != 0) {
            length++;
            current = receipts[current].parentReceiptId;
        }

        // Build the chain array
        chain = new bytes32[](length);
        current = receiptId;
        for (uint256 i = 0; i < length; i++) {
            chain[i] = current;
            current = receipts[current].parentReceiptId;
        }
    }
}
