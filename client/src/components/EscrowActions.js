import React, { useState } from "react";
import { ethers } from "ethers";
import EscrowABI from "../abis/Escrow.json"; // Compile your contract and copy ABI here

const ESCROW_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

function EscrowActions({ account }) {
  const [jobId, setJobId] = useState("");
  const [amount, setAmount] = useState("");
  const [freelancer, setFreelancer] = useState("");

  const createJob = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowABI, signer);
    const tx = await escrow.createJob(
      freelancer,
      ethers.parseEther(amount),
      0, // deadline
      [], // milestones
      0 // EscrowType.MILESTONE
    );
    await tx.wait();
    alert("Job created!");
  };

  return (
    <div>
      <h2>Create Job</h2>
      <input placeholder="Freelancer Address" onChange={e => setFreelancer(e.target.value)} />
      <input placeholder="Amount (ETH)" onChange={e => setAmount(e.target.value)} />
      <button onClick={createJob}>Create Job</button>
    </div>
  );
}

export default EscrowActions;
