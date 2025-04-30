import { useEffect, useState } from "react";
import { ethers } from "ethers";
import EscrowFactoryABI from "../abi/EscrowFactory.json";

const ESCROW_FACTORY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Replace with your actual deployed address

function ShowJobs() {
  const [jobs, setJobs] = useState([]);
  const [userAddress, setUserAddress] = useState(null);
  const [arbitratorAddress, setArbitratorAddress] = useState(null);

  const loadJobs = async () => {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    setUserAddress(address);

    const escrowFactory = new ethers.Contract(
      ESCROW_FACTORY_ADDRESS,
      EscrowFactoryABI,
      signer
    );

    try {
      const arb = await escrowFactory.arbitrator();
      setArbitratorAddress(arb);

      const jobCounter = await escrowFactory.jobCounter();
      const jobsArray = [];

      for (let i = 0; i < jobCounter; i++) {
        const job = await escrowFactory.jobs(i);
        jobsArray.push(job);
      }

      setJobs(jobsArray);
    } catch (error) {
      console.error("Error loading jobs:", error);
    }
  };

  const getStatusText = (status) => {
    switch (Number(status)) {
      case 0: return "Awaiting Delivery";
      case 1: return "Complete";
      case 2: return "Refunded";
      case 3: return "Disputed";
      case 4: return "Resolved";
      default: return "Unknown";
    }
  };

  const raiseDispute = async (jobId) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const escrowFactory = new ethers.Contract(
      ESCROW_FACTORY_ADDRESS,
      EscrowFactoryABI,
      signer
    );

    try {
      const tx = await escrowFactory.raiseDispute(jobId);
      await tx.wait();
      alert("✅ Dispute Raised");
      loadJobs();
    } catch (error) {
      alert("❌ Failed to raise dispute");
    }
  };

  const confirmDelivery = async (jobId) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const escrowFactory = new ethers.Contract(
      ESCROW_FACTORY_ADDRESS,
      EscrowFactoryABI,
      signer
    );

    try {
      const tx = await escrowFactory.confirmDelivery(jobId);
      await tx.wait();
      alert("✅ Delivery Confirmed");
      loadJobs();
    } catch (error) {
      alert("❌ Failed to confirm delivery");
    }
  };

  const resolveDispute = async (jobId, winnerAddress) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const escrowFactory = new ethers.Contract(
      ESCROW_FACTORY_ADDRESS,
      EscrowFactoryABI,
      signer
    );

    try {
      const tx = await escrowFactory.resolveDispute(jobId, winnerAddress);
      await tx.wait();
      alert("✅ Dispute Resolved");
      loadJobs();
    } catch (error) {
      alert("❌ Failed to resolve dispute");
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      <h2>All Freelance Jobs</h2>
      <button onClick={loadJobs} style={{ marginBottom: "20px", padding: "8px" }}>
        🔄 Refresh Jobs
      </button>

      <table style={{ margin: "auto", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid black", padding: "8px" }}>Job ID</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Freelancer</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Amount (ETH)</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Status</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid black", padding: "8px" }}>{index}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>{job.freelancer}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>{ethers.formatEther(job.amount)}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>{getStatusText(job.currentState)}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {Number(job.currentState) === 0 && (
                  <>
                    <button onClick={() => raiseDispute(index)} style={{ marginRight: "8px" }}>Raise Dispute</button>
                    <button onClick={() => confirmDelivery(index)}>Confirm Delivery</button>
                  </>
                )}

                {Number(job.currentState) === 3 && userAddress === arbitratorAddress && (
                  <div>
                    <button
                      onClick={() => {
                        const winner = prompt("Enter winner address (client or freelancer):");
                        if (winner) resolveDispute(index, winner);
                      }}
                    >
                      Resolve Dispute
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ShowJobs;
