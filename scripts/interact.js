const hre = require("hardhat");

async function main() {
  const [deployer, freelancer] = await hre.ethers.getSigners();

  console.log("Deployer address (Client):", deployer.address);
  console.log("Freelancer address:", freelancer.address);

  // **Connect to deployed ReputationNFT**
  const reputationNFTAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
  const ReputationNFT = await hre.ethers.getContractAt("ReputationNFT", reputationNFTAddress);

  // Mint NFT to freelancer
  const mintTx = await ReputationNFT.mint(freelancer.address);
  await mintTx.wait();
  console.log(`✅ Minted Reputation NFT to Freelancer: ${freelancer.address}`);

  // **Connect to deployed EscrowFactory**
  const escrowFactoryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 
  const EscrowFactory = await hre.ethers.getContractAt("EscrowFactory", escrowFactoryAddress);

  // Client creates a Job
  const jobAmount = hre.ethers.parseEther("0.5"); // 0.5 ETH job
  const createJobTx = await EscrowFactory.createJob(freelancer.address, { value: jobAmount });
  const receipt = await createJobTx.wait();
  console.log(`✅ Created Job with Freelancer for 0.5 ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
