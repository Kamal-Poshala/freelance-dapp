const hre = require("hardhat");

async function main() {
  const [deployer, freelancer] = await hre.ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);
  console.log("Freelancer address:", freelancer.address);

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(freelancer.address, {
    value: hre.ethers.parseEther("1"),
  });

  await escrow.waitForDeployment();

  console.log("Escrow contract deployed to:", await escrow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
