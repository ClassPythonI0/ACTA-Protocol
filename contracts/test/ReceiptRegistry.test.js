const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReceiptRegistry", function () {
  let registry;
  let owner;

  const MOCK_JOB_ID    = ethers.id("job-001");
  const MOCK_AGENT_ID  = ethers.id("orchestrator.acta.eth");
  const MOCK_INPUT_HASH  = ethers.id("input-data");
  const MOCK_OUTPUT_HASH = ethers.id("output-data");
  const ACTION_DELEGATION = 0;
  const ACTION_VERIFICATION = 4;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ReceiptRegistry");
    registry = await Factory.deploy();
  });

  describe("issueReceipt", function () {
    it("issues a receipt and emits an event", async function () {
      const tx = await registry.issueReceipt(
        MOCK_JOB_ID,
        ethers.ZeroHash,
        MOCK_AGENT_ID,
        ACTION_DELEGATION,
        MOCK_INPUT_HASH,
        MOCK_OUTPUT_HASH,
        "ipfs://QmEncryptedCID",
        true
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "ReceiptIssued"
      );
      expect(event).to.not.be.undefined;
      expect(event.args.jobId).to.equal(MOCK_JOB_ID);
      expect(event.args.agentId).to.equal(MOCK_AGENT_ID);
    });

    it("stores correct receipt data", async function () {
      const tx = await registry.issueReceipt(
        MOCK_JOB_ID,
        ethers.ZeroHash,
        MOCK_AGENT_ID,
        ACTION_DELEGATION,
        MOCK_INPUT_HASH,
        MOCK_OUTPUT_HASH,
        "ipfs://QmTest",
        true
      );
      const txReceipt = await tx.wait();
      const event = txReceipt.logs.find(
        (l) => l.fragment && l.fragment.name === "ReceiptIssued"
      );
      const receiptId = event.args.receiptId;

      const stored = await registry.getReceipt(receiptId);
      expect(stored.jobId).to.equal(MOCK_JOB_ID);
      expect(stored.agentId).to.equal(MOCK_AGENT_ID);
      expect(stored.inputHash).to.equal(MOCK_INPUT_HASH);
      expect(stored.outputHash).to.equal(MOCK_OUTPUT_HASH);
      expect(stored.encryptedCID).to.equal("ipfs://QmTest");
    });

    it("reverts on zero jobId", async function () {
      await expect(
        registry.issueReceipt(
          ethers.ZeroHash,
          ethers.ZeroHash,
          MOCK_AGENT_ID,
          ACTION_DELEGATION,
          MOCK_INPUT_HASH,
          MOCK_OUTPUT_HASH,
          "",
          false
        )
      ).to.be.revertedWithCustomError(registry, "InvalidHash");
    });
  });

  describe("getJobAuditTrail", function () {
    it("returns receipts in order for a job", async function () {
      const agentId2 = ethers.id("researcher.acta.eth");

      const tx1 = await registry.issueReceipt(
        MOCK_JOB_ID, ethers.ZeroHash, MOCK_AGENT_ID,
        ACTION_DELEGATION, MOCK_INPUT_HASH, MOCK_OUTPUT_HASH, "", true
      );
      const r1 = await tx1.wait();
      const e1 = r1.logs.find((l) => l.fragment?.name === "ReceiptIssued");
      const receiptId1 = e1.args.receiptId;

      await registry.issueReceipt(
        MOCK_JOB_ID, receiptId1, agentId2,
        0, MOCK_INPUT_HASH, MOCK_OUTPUT_HASH, "", true
      );

      const trail = await registry.getJobAuditTrail(MOCK_JOB_ID);
      expect(trail.length).to.equal(2);
    });
  });

  describe("verifyOutput", function () {
    it("returns true when output hash matches", async function () {
      const tx = await registry.issueReceipt(
        MOCK_JOB_ID, ethers.ZeroHash, MOCK_AGENT_ID,
        ACTION_DELEGATION, MOCK_INPUT_HASH, MOCK_OUTPUT_HASH, "", true
      );
      const r = await tx.wait();
      const event = r.logs.find((l) => l.fragment?.name === "ReceiptIssued");
      const receiptId = event.args.receiptId;

      expect(await registry.verifyOutput(receiptId, MOCK_OUTPUT_HASH)).to.be.true;
    });

    it("returns false when output hash does not match (drift detected)", async function () {
      const tx = await registry.issueReceipt(
        MOCK_JOB_ID, ethers.ZeroHash, MOCK_AGENT_ID,
        ACTION_DELEGATION, MOCK_INPUT_HASH, MOCK_OUTPUT_HASH, "", true
      );
      const r = await tx.wait();
      const event = r.logs.find((l) => l.fragment?.name === "ReceiptIssued");
      const receiptId = event.args.receiptId;

      const differentHash = ethers.id("different-output");
      expect(await registry.verifyOutput(receiptId, differentHash)).to.be.false;
    });
  });

  describe("traceChain", function () {
    it("traces the receipt chain back to root", async function () {
      const tx1 = await registry.issueReceipt(
        MOCK_JOB_ID, ethers.ZeroHash, MOCK_AGENT_ID,
        ACTION_DELEGATION, MOCK_INPUT_HASH, MOCK_OUTPUT_HASH, "", true
      );
      const r1 = await tx1.wait();
      const e1 = r1.logs.find((l) => l.fragment?.name === "ReceiptIssued");
      const receiptId1 = e1.args.receiptId;

      const tx2 = await registry.issueReceipt(
        MOCK_JOB_ID, receiptId1, MOCK_AGENT_ID,
        ACTION_VERIFICATION, MOCK_INPUT_HASH, MOCK_OUTPUT_HASH, "", true
      );
      const r2 = await tx2.wait();
      const e2 = r2.logs.find((l) => l.fragment?.name === "ReceiptIssued");
      const receiptId2 = e2.args.receiptId;

      const chain = await registry.traceChain(receiptId2);
      expect(chain.length).to.equal(2);
      expect(chain[0]).to.equal(receiptId2);
      expect(chain[1]).to.equal(receiptId1);
    });
  });
});
