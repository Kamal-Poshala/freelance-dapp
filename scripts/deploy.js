const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // Deploy ReputationNFT first
  const ReputationNFT = await hre.ethers.getContractFactory("ReputationNFT");
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  console.log("ReputationNFT deployed to:", await reputationNFT.getAddress());

  // Deploy EscrowFactory, setting deployer as arbitrator (for now)
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.deploy(deployer.address);
  await escrowFactory.waitForDeployment();
  console.log("EscrowFactory deployed to:", await escrowFactory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
