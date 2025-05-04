const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy ReputationToken contract
  const ReputationToken = await ethers.getContractFactory("ReputationToken");
  const repToken = await ReputationToken.deploy("Reputation Token", "RPT", deployer.address);
  await repToken.waitForDeployment();
  const repTokenAddress = await repToken.getAddress();
  console.log("ReputationToken deployed to:", repTokenAddress);

  // Deploy Escrow contract with ReputationToken address
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.connect(deployer).deploy(repTokenAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("Escrow deployed to:", escrowAddress);

  // Grant MINTER_BURNER_ROLE to Escrow contract
  const MINTER_BURNER_ROLE = ethers.id("MINTER_BURNER_ROLE"); // keccak256("MINTER_BURNER_ROLE")
  const tx = await repToken.grantRole(MINTER_BURNER_ROLE, escrowAddress);
  await tx.wait();
  console.log("Granted MINTER_BURNER_ROLE to Escrow at:", escrowAddress);

  // Deploy DisputeDAO contract
  const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
  const dao = await DisputeDAO.deploy();
  await dao.waitForDeployment();
  console.log("DAO deployed to:", await dao.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});