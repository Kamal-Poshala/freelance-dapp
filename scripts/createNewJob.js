const hre = require("hardhat");

async function main() {
  const [client, freelancer] = await hre.ethers.getSigners();

  const escrowFactoryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // your deployed address
  const EscrowFactory = await hre.ethers.getContractAt("EscrowFactory", escrowFactoryAddress);

  const jobAmount = hre.ethers.parseEther("1.0"); // 1 ETH job
  const createJobTx = await EscrowFactory.connect(client).createJob(freelancer.address, { value: jobAmount });
  await createJobTx.wait();
  console.log(`✅ Created a new fresh Job between client and freelancer.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
