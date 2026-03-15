const { ethers, network } = require("hardhat");

/**
 * ACTA Protocol — Status Network Sepolia Deployment
 *
 * Status Network is a gasless Ethereum L2 — gas is literally 0 at the protocol level.
 * This means ACTA can submit cryptographic receipts for every agent action at zero cost,
 * making granular on-chain audit trails economically viable at any scale.
 *
 * Chain ID: 1660990954
 * Explorer: https://sepoliascan.status.network
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("─────────────────────────────────────────");
  console.log("ACTA Protocol — Status Network Deployment");
  console.log("─────────────────────────────────────────");
  console.log("Network:  ", network.name);
  console.log("Chain ID: ", network.config.chainId);
  console.log("Deployer: ", deployer.address);
  console.log("Balance:  ", ethers.formatEther(balance), "ETH");
  console.log("Gas Price:", "0 (gasless network)");
  console.log("─────────────────────────────────────────\n");

  const overrides = { gasPrice: 0 };

  // 1. Deploy AgentRegistry
  console.log("Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(overrides);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("AgentRegistry deployed to:   ", registryAddress);

  // 2. Deploy ReceiptRegistry
  console.log("\nDeploying ReceiptRegistry...");
  const ReceiptRegistry = await ethers.getContractFactory("ReceiptRegistry");
  const receipts = await ReceiptRegistry.deploy(overrides);
  await receipts.waitForDeployment();
  const receiptsAddress = await receipts.getAddress();
  console.log("ReceiptRegistry deployed to: ", receiptsAddress);

  // 3. Deploy ReputationEngine
  console.log("\nDeploying ReputationEngine...");
  const ReputationEngine = await ethers.getContractFactory("ReputationEngine");
  const reputation = await ReputationEngine.deploy(receiptsAddress, overrides);
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("ReputationEngine deployed to:", reputationAddress);

  // 4. Emit a gasless receipt as proof-of-concept
  console.log("\nSubmitting proof-of-concept gasless receipt...");
  const ZERO = ethers.ZeroHash;
  const agentId = ethers.keccak256(ethers.toUtf8Bytes("acta-status-demo-agent"));
  const jobId  = ethers.keccak256(ethers.toUtf8Bytes("status-network-genesis-job"));
  const inputH = ethers.keccak256(ethers.toUtf8Bytes("status-network-deployment"));
  const outputH = ethers.keccak256(ethers.toUtf8Bytes("acta-protocol-gasless-receipt"));

  const tx = await receipts.issueReceipt(
    jobId,   // jobId
    ZERO,    // parentReceiptId
    agentId, // agentId
    3,       // ActionType.OUTPUT
    inputH,
    outputH,
    "",      // encryptedCID
    true,    // passed
    overrides
  );
  const receipt = await tx.wait();
  console.log("Gasless receipt tx hash:     ", tx.hash);
  console.log("Gas used:                    ", receipt.gasUsed.toString(), "(cost: 0 ETH)");

  // Save deployment info
  const fs = require("fs");
  const deployInfo = {
    network: "statusSepolia",
    chainId: 1660990954,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    gasPrice: 0,
    contracts: {
      AgentRegistry:    registryAddress,
      ReceiptRegistry:  receiptsAddress,
      ReputationEngine: reputationAddress,
    },
    proof: {
      description: "Gasless proof-of-concept receipt issued at deployment",
      tx_hash: tx.hash,
      gas_used: receipt.gasUsed.toString(),
      gas_cost_eth: "0",
    },
  };

  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync("./deployments/statusSepolia.json", JSON.stringify(deployInfo, null, 2));

  console.log("\n─────────────────────────────────────────");
  console.log("Deployment complete — all gas cost: 0 ETH");
  console.log("─────────────────────────────────────────");
  console.log("AgentRegistry:    ", registryAddress);
  console.log("ReceiptRegistry:  ", receiptsAddress);
  console.log("ReputationEngine: ", reputationAddress);
  console.log("\nExplorer: https://sepoliascan.status.network");
  console.log(`\nDeployment info saved to deployments/statusSepolia.json`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
