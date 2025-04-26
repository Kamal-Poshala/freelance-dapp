const hre = require("hardhat");

async function main() {
  const [client, freelancer] = await hre.ethers.getSigners();

  console.log("Client address:", client.address);
  console.log("Freelancer address:", freelancer.address);

  // Connect to EscrowFactory
  const escrowFactoryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // your deployed address
  const EscrowFactory = await hre.ethers.getContractAt("EscrowFactory", escrowFactoryAddress);

  // Step 1: Freelancer (or Client) raises a dispute
  const jobId = 1; // First job
  const raiseDisputeTx = await EscrowFactory.connect(freelancer).raiseDispute(jobId);
  await raiseDisputeTx.wait();
  console.log(`✅ Dispute raised for Job ID ${jobId} by Freelancer`);

  // Step 2: Deployer (Client) resolves the dispute
  const resolveDisputeTx = await EscrowFactory.connect(client).resolveDispute(jobId, freelancer.address);
  await resolveDisputeTx.wait();
  console.log(`✅ Dispute resolved: Freelancer ${freelancer.address} won the case and received funds`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
