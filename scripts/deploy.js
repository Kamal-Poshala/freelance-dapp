const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Escrow contract (0 arguments)
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.connect(deployer).deploy();
  await escrow.waitForDeployment();
  console.log("Escrow deployed to:", await escrow.getAddress());

  // Deploy ReputationToken contract (3 arguments: name, symbol, initialOwner)
  const ReputationToken = await ethers.getContractFactory("ReputationToken");
  const repToken = await ReputationToken.deploy("Reputation Token", "RPT", deployer.address);
  await repToken.waitForDeployment();
  console.log("ReputationToken deployed to:", await repToken.getAddress());

  // Deploy DisputeDAO contract (0 arguments)
  const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
  const dao = await DisputeDAO.deploy();
  await dao.waitForDeployment();
  console.log("DAO deployed to:", await dao.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});