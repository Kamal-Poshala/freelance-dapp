import { useState } from "react";
import { ethers } from "ethers";
import EscrowFactoryABI from "../abi/EscrowFactory.json";

const ESCROW_FACTORY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

function CreateJob() {
  const [freelancerAddress, setFreelancerAddress] = useState("");
  const [jobAmount, setJobAmount] = useState("");

  const createJob = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const escrowFactory = new ethers.Contract(
      ESCROW_FACTORY_ADDRESS,
      EscrowFactoryABI,
      signer
    );

    try {
      const tx = await escrowFactory.createJob(freelancerAddress, {
        value: ethers.parseEther(jobAmount),
      });
      await tx.wait();
      alert("✅ Job created successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Failed to create job.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      <h2>Create New Freelance Job</h2>

      <input
        type="text"
        placeholder="Freelancer Address"
        value={freelancerAddress}
        onChange={(e) => setFreelancerAddress(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px" }}
      />
      <br />
      <input
        type="text"
        placeholder="Amount in ETH"
        value={jobAmount}
        onChange={(e) => setJobAmount(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px" }}
      />
      <br />
      <button onClick={createJob}>Create Job</button>
    </div>
  );
}

export default CreateJob;
