// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReputationEngine
 * @notice ACTA Protocol — Pillar 2: Reputation
 *
 * Every time an agent completes a job, its outcome (pass/fail) is recorded here.
 * Scores start at 500 (neutral), rise on successes, fall on failures.
 * The score is permanently on-chain — no platform can alter or delete it.
 */
contract ReputationEngine {

    // ─────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────

    struct ReputationRecord {
        uint256 score;         // Current score (0–1000)
        uint256 totalJobs;     // Total jobs completed
        uint256 passedJobs;    // Jobs that passed verification
        uint256 failedJobs;    // Jobs that failed verification
        uint256 lastUpdated;   // Block timestamp of last update
        bool    exists;
    }

    // ─────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────

    uint256 public constant INITIAL_SCORE  = 500;
    uint256 public constant MAX_SCORE      = 1000;
    uint256 public constant MIN_SCORE      = 0;
    uint256 public constant PASS_REWARD    = 10;   // +10 per successful job
    uint256 public constant FAIL_PENALTY   = 20;   // -20 per failed job

    // ─────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────

    mapping(bytes32 => ReputationRecord) public reputations;
    bytes32[] public agentIds;

    address public immutable owner;
    address public receiptRegistry;

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    event ReputationInitialized(bytes32 indexed agentId, uint256 initialScore);
    event ReputationUpdated(
        bytes32 indexed agentId,
        bool    passed,
        uint256 oldScore,
        uint256 newScore,
        uint256 totalJobs,
        uint256 passRate
    );

    // ─────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────

    error NotAuthorized();
    error AgentNotRegistered(bytes32 agentId);

    // ─────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────

    constructor(address _receiptRegistry) {
        owner = msg.sender;
        receiptRegistry = _receiptRegistry;
    }

    // ─────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────

    modifier onlyOwnerOrRegistry() {
        if (msg.sender != owner && msg.sender != receiptRegistry) {
            revert NotAuthorized();
        }
        _;
    }

    // ─────────────────────────────────────────────────────────
    // Write Functions
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Initialize a new agent's reputation record.
     * @param agentId  The agent's on-chain ID from AgentRegistry.
     */
    function initializeAgent(bytes32 agentId) external onlyOwnerOrRegistry {
        if (reputations[agentId].exists) return;

        reputations[agentId] = ReputationRecord({
            score:       INITIAL_SCORE,
            totalJobs:   0,
            passedJobs:  0,
            failedJobs:  0,
            lastUpdated: block.timestamp,
            exists:      true
        });
        agentIds.push(agentId);

        emit ReputationInitialized(agentId, INITIAL_SCORE);
    }

    /**
     * @notice Record the outcome of a completed job and update the agent's score.
     * @param agentId  The agent's on-chain ID.
     * @param passed   True if the job passed verification, false if it failed.
     */
    function recordOutcome(bytes32 agentId, bool passed) external onlyOwnerOrRegistry {
        ReputationRecord storage rec = reputations[agentId];
        if (!rec.exists) revert AgentNotRegistered(agentId);

        uint256 oldScore = rec.score;
        rec.totalJobs++;

        if (passed) {
            rec.passedJobs++;
            rec.score = _min(rec.score + PASS_REWARD, MAX_SCORE);
        } else {
            rec.failedJobs++;
            rec.score = rec.score >= FAIL_PENALTY
                ? rec.score - FAIL_PENALTY
                : MIN_SCORE;
        }

        rec.lastUpdated = block.timestamp;

        uint256 passRate = rec.totalJobs > 0
            ? (rec.passedJobs * 100) / rec.totalJobs
            : 0;

        emit ReputationUpdated(agentId, passed, oldScore, rec.score, rec.totalJobs, passRate);
    }

    // ─────────────────────────────────────────────────────────
    // Read Functions
    // ─────────────────────────────────────────────────────────

    function getReputation(bytes32 agentId) external view returns (ReputationRecord memory) {
        return reputations[agentId];
    }

    function getPassRate(bytes32 agentId) external view returns (uint256) {
        ReputationRecord memory rec = reputations[agentId];
        if (rec.totalJobs == 0) return 0;
        return (rec.passedJobs * 100) / rec.totalJobs;
    }

    function getAllAgentIds() external view returns (bytes32[] memory) {
        return agentIds;
    }

    // ─────────────────────────────────────────────────────────
    // Internal
    // ─────────────────────────────────────────────────────────

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
