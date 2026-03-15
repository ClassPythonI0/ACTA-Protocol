// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AgentRegistry
/// @notice ACTA Protocol — Pillar 1: Identity
/// @dev Registers AI agents with on-chain identities, capability manifests, and ENS-compatible names.
///      Every registered agent gets a unique agentId, a human-readable handle, and a signed
///      capability manifest describing what the agent claims it can do.

contract AgentRegistry {

    // ─────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────

    struct Agent {
        bytes32 agentId;          // Unique identifier (hash of owner + name + nonce)
        address owner;            // Human wallet that registered this agent
        string  name;             // Human-readable name (e.g. "researcher.acta.eth")
        string  model;            // LLM model powering this agent (e.g. "claude-sonnet-4-6")
        string  capabilityHash;   // IPFS CID or hash of the capability manifest JSON
        string  harnessType;      // Agent harness (e.g. "claude-code", "cursor", "other")
        uint256 registeredAt;     // Block timestamp of registration
        bool    active;           // Whether the agent is currently active
    }

    // ─────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────

    mapping(bytes32 => Agent)   private agents;          // agentId → Agent
    mapping(address => bytes32[]) private ownerAgents;   // owner → list of agentIds
    mapping(string  => bytes32) private nameToId;        // name → agentId (enforces uniqueness)

    uint256 private nonce;

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed owner,
        string  name,
        string  model,
        uint256 registeredAt
    );

    event AgentDeactivated(bytes32 indexed agentId, address indexed owner);
    event CapabilityUpdated(bytes32 indexed agentId, string newCapabilityHash);

    // ─────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────

    error NameAlreadyTaken(string name);
    error AgentNotFound(bytes32 agentId);
    error NotAgentOwner(bytes32 agentId, address caller);
    error AgentAlreadyInactive(bytes32 agentId);
    error EmptyField(string fieldName);

    // ─────────────────────────────────────────────────────────
    // Register
    // ─────────────────────────────────────────────────────────

    /// @notice Register a new AI agent on ACTA Protocol
    /// @param name          Human-readable unique name for the agent
    /// @param model         LLM model identifier
    /// @param capabilityHash IPFS CID of the capability manifest
    /// @param harnessType   Agent harness type
    /// @return agentId      The unique on-chain ID assigned to this agent
    function registerAgent(
        string calldata name,
        string calldata model,
        string calldata capabilityHash,
        string calldata harnessType
    ) external returns (bytes32 agentId) {
        if (bytes(name).length == 0)            revert EmptyField("name");
        if (bytes(model).length == 0)           revert EmptyField("model");
        if (bytes(capabilityHash).length == 0)  revert EmptyField("capabilityHash");
        if (nameToId[name] != bytes32(0))       revert NameAlreadyTaken(name);

        agentId = keccak256(abi.encodePacked(msg.sender, name, nonce++));

        agents[agentId] = Agent({
            agentId:        agentId,
            owner:          msg.sender,
            name:           name,
            model:          model,
            capabilityHash: capabilityHash,
            harnessType:    harnessType,
            registeredAt:   block.timestamp,
            active:         true
        });

        ownerAgents[msg.sender].push(agentId);
        nameToId[name] = agentId;

        emit AgentRegistered(agentId, msg.sender, name, model, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────────────────────

    /// @notice Update an agent's capability manifest (when its skills change)
    function updateCapability(bytes32 agentId, string calldata newCapabilityHash) external {
        Agent storage agent = _requireOwner(agentId);
        if (bytes(newCapabilityHash).length == 0) revert EmptyField("newCapabilityHash");
        agent.capabilityHash = newCapabilityHash;
        emit CapabilityUpdated(agentId, newCapabilityHash);
    }

    /// @notice Deactivate an agent (soft delete — history is preserved)
    function deactivateAgent(bytes32 agentId) external {
        Agent storage agent = _requireOwner(agentId);
        if (!agent.active) revert AgentAlreadyInactive(agentId);
        agent.active = false;
        emit AgentDeactivated(agentId, msg.sender);
    }

    // ─────────────────────────────────────────────────────────
    // Read
    // ─────────────────────────────────────────────────────────

    /// @notice Get agent details by agentId
    function getAgent(bytes32 agentId) external view returns (Agent memory) {
        if (agents[agentId].registeredAt == 0) revert AgentNotFound(agentId);
        return agents[agentId];
    }

    /// @notice Resolve a name to an agentId
    function resolveByName(string calldata name) external view returns (bytes32) {
        bytes32 id = nameToId[name];
        if (id == bytes32(0)) revert AgentNotFound(bytes32(0));
        return id;
    }

    /// @notice Get all agentIds owned by an address
    function getAgentsByOwner(address owner) external view returns (bytes32[] memory) {
        return ownerAgents[owner];
    }

    /// @notice Check if an agent is active
    function isActive(bytes32 agentId) external view returns (bool) {
        return agents[agentId].active;
    }

    // ─────────────────────────────────────────────────────────
    // Internal
    // ─────────────────────────────────────────────────────────

    function _requireOwner(bytes32 agentId) internal view returns (Agent storage) {
        Agent storage agent = agents[agentId];
        if (agent.registeredAt == 0)    revert AgentNotFound(agentId);
        if (agent.owner != msg.sender)  revert NotAgentOwner(agentId, msg.sender);
        return agent;
    }
}
