const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("─────────────────────────────────────────");
  console.log("ACTA Protocol — Contract Deployment");
  console.log("─────────────────────────────────────────");
  console.log("Network:  ", network.name);
  console.log("Deployer: ", deployer.address);
  console.log("Balance:  ", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("─────────────────────────────────────────\n");

  const EXISTING = {
    AgentRegistry:   "0xcd454b704FED5744893874D70DE1A3F3C0858407",
    ReceiptRegistry: "0x7FbC5257a73b51Fd01859cd50C7A1eAA5E476EA1",
  };

  console.log("AgentRegistry already deployed at:  ", EXISTING.AgentRegistry);
  console.log("ReceiptRegistry already deployed at:", EXISTING.ReceiptRegistry);

  // Deploy ReputationEngine
  console.log("\nDeploying ReputationEngine...");
  let nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const ReputationEngine = await ethers.getContractFactory("ReputationEngine");
  const reputation = await ReputationEngine.deploy(EXISTING.ReceiptRegistry, { nonce });
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("ReputationEngine deployed to:", reputationAddress);

  console.log("\n─────────────────────────────────────────");
  console.log("Deployment complete.");
  console.log("─────────────────────────────────────────");
  console.log("AgentRegistry:     ", EXISTING.AgentRegistry);
  console.log("ReceiptRegistry:   ", EXISTING.ReceiptRegistry);
  console.log("ReputationEngine:  ", reputationAddress);
  console.log("\nAdd to your .env:");
  console.log(`REPUTATION_ENGINE_ADDRESS=${reputationAddress}`);

  const fs = require("fs");
  const deployInfo = {
    network: network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      AgentRegistry:    EXISTING.AgentRegistry,
      ReceiptRegistry:  EXISTING.ReceiptRegistry,
      ReputationEngine: reputationAddress,
    },
  };
  const outPath = `./deployments/${network.name}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployInfo, null, 2));
  console.log(`\nDeployment info saved to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
