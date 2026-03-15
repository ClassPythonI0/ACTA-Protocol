const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
  let registry;
  let owner, other;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgentRegistry");
    registry = await Factory.deploy();
  });

  describe("registerAgent", function () {
    it("registers an agent and returns a valid agentId", async function () {
      const tx = await registry.registerAgent(
        "orchestrator.acta.eth",
        "claude-sonnet-4-6",
        "QmCapabilityHashABC123",
        "claude-code"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "AgentRegistered"
      );
      expect(event).to.not.be.undefined;
      const agentId = event.args.agentId;
      expect(agentId).to.not.equal(ethers.ZeroHash);
    });

    it("stores correct agent data", async function () {
      const tx = await registry.registerAgent(
        "researcher.acta.eth",
        "claude-sonnet-4-6",
        "QmCapabilityHashXYZ",
        "claude-code"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "AgentRegistered"
      );
      const agentId = event.args.agentId;

      const agent = await registry.getAgent(agentId);
      expect(agent.name).to.equal("researcher.acta.eth");
      expect(agent.model).to.equal("claude-sonnet-4-6");
      expect(agent.owner).to.equal(owner.address);
      expect(agent.active).to.be.true;
    });

    it("reverts on duplicate name", async function () {
      await registry.registerAgent(
        "writer.acta.eth",
        "claude-sonnet-4-6",
        "QmHash1",
        "claude-code"
      );
      await expect(
        registry.registerAgent(
          "writer.acta.eth",
          "gpt-4",
          "QmHash2",
          "other"
        )
      ).to.be.revertedWithCustomError(registry, "NameAlreadyTaken");
    });

    it("reverts on empty name", async function () {
      await expect(
        registry.registerAgent("", "claude-sonnet-4-6", "QmHash", "claude-code")
      ).to.be.revertedWithCustomError(registry, "EmptyField");
    });
  });

  describe("resolveByName", function () {
    it("resolves a name to an agentId", async function () {
      const tx = await registry.registerAgent(
        "verifier.acta.eth",
        "claude-sonnet-4-6",
        "QmHash",
        "claude-code"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "AgentRegistered"
      );
      const agentId = event.args.agentId;

      const resolved = await registry.resolveByName("verifier.acta.eth");
      expect(resolved).to.equal(agentId);
    });
  });

  describe("deactivateAgent", function () {
    it("deactivates an agent", async function () {
      const tx = await registry.registerAgent(
        "temp.acta.eth",
        "claude-sonnet-4-6",
        "QmHash",
        "claude-code"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "AgentRegistered"
      );
      const agentId = event.args.agentId;

      await registry.deactivateAgent(agentId);
      expect(await registry.isActive(agentId)).to.be.false;
    });

    it("reverts if not owner", async function () {
      const tx = await registry.registerAgent(
        "private.acta.eth",
        "claude-sonnet-4-6",
        "QmHash",
        "claude-code"
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "AgentRegistered"
      );
      const agentId = event.args.agentId;

      await expect(
        registry.connect(other).deactivateAgent(agentId)
      ).to.be.revertedWithCustomError(registry, "NotAgentOwner");
    });
  });

  describe("getAgentsByOwner", function () {
    it("returns all agents registered by an owner", async function () {
      await registry.registerAgent("agent1.acta.eth", "model1", "QmH1", "claude-code");
      await registry.registerAgent("agent2.acta.eth", "model2", "QmH2", "cursor");
      const ids = await registry.getAgentsByOwner(owner.address);
      expect(ids.length).to.equal(2);
    });
  });
});
