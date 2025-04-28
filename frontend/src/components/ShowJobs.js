import { useEffect, useState } from "react";
import { ethers } from "ethers";
import EscrowFactoryABI from "../abi/EscrowFactory.json";

const ESCROW_FACTORY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // your deployed address

function ShowJobs() {
  const [jobs, setJobs] = useState([]);

  const loadJobs = async () => {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const escrowFactory = new ethers.Contract(
      ESCROW_FACTORY_ADDRESS,
      EscrowFactoryABI,
      signer
    );

    try {
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
    switch (status) {
      case 0:
        return "Awaiting Delivery";
      case 1:
        return "Complete";
      case 2:
        return "Refunded";
      case 3:
        return "Disputed";
      case 4:
        return "Resolved";
      default:
        return "Unknown";
    }
  };

  const raiseDispute = async (jobId) => {
    if (!window.ethereum) return;

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
      alert("✅ Dispute Raised Successfully!");
      loadJobs(); // Refresh the table after dispute raised
    } catch (error) {
      console.error("Error raising dispute:", error);
      alert("❌ Failed to raise dispute.");
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
            <th style={{ border: "1px solid black", padding: "8px" }}>Actions</th> {/* NEW Column */}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid black", padding: "8px" }}>{index}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>{job.freelancer}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>{ethers.formatEther(job.amount)}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>{getStatusText(job.status)}</td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {job.status === 0 && (
                  <button onClick={() => raiseDispute(index)}>Raise Dispute</button>
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
