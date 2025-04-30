const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("📦 Deploying contracts with account:", deployer.address);

  // 1. Deploy ReputationNFT
  const ReputationNFT = await hre.ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  const reputationNFTAddress = await reputationNFT.getAddress();
  console.log("✅ ReputationNFT deployed to:", reputationNFTAddress);

  // 2. Deploy EscrowFactory with deployer as arbitrator
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.deploy(deployer.address); // Pass arbitrator
  await escrowFactory.waitForDeployment();
  const escrowFactoryAddress = await escrowFactory.getAddress();
  console.log("✅ EscrowFactory deployed to:", escrowFactoryAddress);

  // Optional: Save to JSON file (future enhancement)
  /*
  const fs = require("fs");
  const deploymentInfo = {
    ReputationNFT: reputationNFTAddress,
    EscrowFactory: escrowFactoryAddress,
  };
  fs.writeFileSync("deployedContracts.json", JSON.stringify(deploymentInfo, null, 2));
  */
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
