import './App.css';

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import EscrowJSON from "./abis/Escrow.json";
import ReputationTokenJSON from "./abis/ReputationToken.json";
import DAOJSON from "./abis/DisputeDAO.json";
import config from "./config.json";

// Contract addresses
const ESCROW_ADDRESS = config.ESCROW_ADDRESS;
const REP_TOKEN_ADDRESS = config.REP_TOKEN_ADDRESS;
const DAO_ADDRESS = config.DAO_ADDRESS;

// Pinata setup
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.REACT_APP_PINATA_API_SECRET;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Hardhat accounts for testing (without private keys for security)
const HARDHAT_ACCOUNTS = [
  { 
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 
    label: "Client (Account 0)", 

    privateKey: "" // Private key of the address should be filled here 

  },
  { 
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
    label: "Freelancer (Account 1)", 
    privateKey: "" // Private key of the address should be filled here
  },
  { 
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 
    label: "Freelancer (Account 2)", 
    privateKey: "" // Private key of the address should be filled here
  },
  { 
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", 
    label: "Freelancer (Account 3)", 

    privateKey: "" // Private key of the address should be filled here

  },
  {
    address: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    label: "Arbitrator (Account 2)",
    privateKey: "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65a3e6e57dbd8b5b8bd8c5b2f1"
  }
];

// Function to upload file to Pinata
const uploadToPinata = async (file) => {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });
    return response.data.IpfsHash; // e.g., "Qm..."
  } catch (error) {
    throw new Error("Pinata upload failed: " + (error.response?.data?.error || error.message));
  }
};

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [repToken, setRepToken] = useState(null);
  const [dao, setDao] = useState(null);
  const [txStatus, setTxStatus] = useState("");
  const [txHistory, setTxHistory] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(HARDHAT_ACCOUNTS[0].address);
const [role, setRole] = useState("Client"); // Default to Client

  // Escrow states
  const [freelancer, setFreelancer] = useState("");
  const [amount, setAmount] = useState("");
  const [jobId, setJobId] = useState("");
  const [file, setFile] = useState(null);
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [repBalance, setRepBalance] = useState(0);

  // DAO states
useEffect(() => {
  const match = HARDHAT_ACCOUNTS.find(acc => acc.address === selectedAccount);
  if (match) {
    const label = match.label.toLowerCase();
    if (label.includes("freelancer")) setRole("Freelancer");
    else if (label.includes("arbitrator")) setRole("Arbitrator");
    else setRole("Client");
  }
}, [selectedAccount]);

const [disputedJobs, setDisputedJobs] = useState([]);

useEffect(() => {
  if (jobs.length > 0) {
    const filtered = jobs.filter(job => job.status === "Disputed");
    setDisputedJobs(filtered);
  }
}, [jobs]);

const resolveDispute = async (jobId, releaseToFreelancer) => {
  if (!escrow) return;
  try {
    setTxStatus("Pending: Resolving dispute...");
    addToTxHistory("Pending: Resolving dispute...");
    const tx = await escrow.resolveDispute(jobId, releaseToFreelancer);
    await tx.wait();
    const recipient = releaseToFreelancer ? "Freelancer" : "Client";
    setTxStatus(`Success: Funds released to ${recipient}`);
    addToTxHistory(`Success: Funds released to ${recipient}`);
  } catch (error) {
    console.error("Resolve dispute failed:", error);
    setTxStatus(`Error: ${error.reason || error.message}`);
    addToTxHistory(`Error: ${error.reason || error.message}`);
  }
};

  const [disputeId, setDisputeId] = useState("");
  const [voteOption, setVoteOption] = useState("");

  // Wallet connection and contract setup
  const connectWallet = async () => {
    try {
      let _provider;
      if (window.ethereum) {
        _provider = new ethers.BrowserProvider(window.ethereum);
        await _provider.send("eth_requestAccounts", []);
      } else {
        _provider = new ethers.JsonRpcProvider("http://localhost:8545");
      }

      // Find the selected account's private key
      const selectedAccountData = HARDHAT_ACCOUNTS.find(acc => acc.address === selectedAccount);
      if (!selectedAccountData) {
        throw new Error("Selected account not found in HARDHAT_ACCOUNTS.");
      }

      // Check if private key is provided
      if (!selectedAccountData.privateKey) {
        throw new Error("Private key missing for selected account. Add it to HARDHAT_ACCOUNTS for local testing.");
      }

      // Create a Wallet (Signer) using the private key
      const _signer = new ethers.Wallet(selectedAccountData.privateKey, _provider);
      const _account = await _signer.getAddress();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);

      setEscrow(new ethers.Contract(ESCROW_ADDRESS, EscrowJSON.abi, _signer));
      setRepToken(new ethers.Contract(REP_TOKEN_ADDRESS, ReputationTokenJSON.abi, _signer));
      setDao(new ethers.Contract(DAO_ADDRESS, DAOJSON.abi, _signer));
    } catch (error) {
      console.error("Wallet connection failed:", error);
      const errorMessage = `Error: Failed to connect wallet - ${error.message}`;
      setTxStatus(errorMessage);
      addToTxHistory(errorMessage);
    }
  };

  // Add to transaction history
  const addToTxHistory = (message) => {
    setTxHistory((prev) => [message, ...prev.slice(0, 4)]); // Keep last 5
  };

  // Fetch reputation balance
  const fetchRep = async () => {
    if (repToken && account) {
      try {
        const bal = await repToken.balanceOf(account);
        setRepBalance(ethers.formatUnits(bal, 18));
      } catch (error) {
        console.error("Fetch balance failed:", error);
        setTxStatus("Error: Failed to fetch reputation balance");
        addToTxHistory("Error: Failed to fetch reputation balance");
      }
    }
  };

  useEffect(() => {
    fetchRep();
  }, [repToken, account]);

  // Fetch active jobs
  const fetchJobs = async () => {
    if (escrow && account) {
      try {
        const jobCount = await escrow.jobCount();
        const jobList = [];
        for (let i = 1; i <= jobCount; i++) {
          const job = await escrow.jobs(i);
          jobList.push({
            id: i,
            client: job.client,
            freelancer: job.freelancer,
            amount: ethers.formatEther(job.amount),
            deliveryUrl: job.deliveryUrl,
          });
        }
        setJobs(jobList);
      } catch (error) {
        console.error("Fetch jobs failed:", error);
      }
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [escrow, account]);

  // Fetch open disputes
  useEffect(() => {
    const fetchDisputes = async () => {
      if (dao && account) {
        try {
          const disputeCount = await dao.disputeCount();
          const disputeList = [];
          for (let i = 1; i <= disputeCount; i++) {
            const dispute = await dao.disputes(i);
            if (!dispute.resolved) {
              disputeList.push({
                id: i,
                client: dispute.client,
                freelancer: dispute.freelancer,
                reason: dispute.reason,
                votesClient: dispute.votesClient.toString(),
                votesFreelancer: dispute.votesFreelancer.toString(),
              });
            }
          }
          setDisputes(disputeList);
        } catch (error) {
          console.error("Fetch disputes failed:", error);
        }
      }
    };
    fetchDisputes();
  }, [dao, account]);

  // Escrow: Create a job
  const createJob = async () => {
    if (!escrow || !freelancer || !amount) {
      setTxStatus("Error: Please provide freelancer address and amount");
      addToTxHistory("Error: Please provide freelancer address and amount");
      return;
    }
    if (!ethers.isAddress(freelancer)) {
      setTxStatus("Error: Invalid freelancer address");
      addToTxHistory("Error: Invalid freelancer address");
      return;
    }
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setTxStatus("Error: Amount must be a positive number");
      addToTxHistory("Error: Amount must be a positive number");
      return;
    }
    try {
      setTxStatus("Pending: Creating job...");
      addToTxHistory("Pending: Creating job...");
      const tx = await escrow.createJob(freelancer, ethers.parseEther(amount));
      setTxStatus("Pending: Waiting for confirmation...");
      addToTxHistory("Pending: Waiting for confirmation...");
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return escrow.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(e => e && e.name === "JobCreated");
      if (event) {
        setJobId(event.args.jobId.toString());
        setTxStatus(`Success: Job created with ID: ${event.args.jobId}`);
        addToTxHistory(`Success: Job created with ID: ${event.args.jobId}`);
        await fetchJobs(); // Refresh jobs
      } else {
        setTxStatus("Error: Job creation failed: No JobCreated event");
        addToTxHistory("Error: Job creation failed: No JobCreated event");
      }
    } catch (error) {
      console.error("Create job failed:", error);
      setTxStatus(`Error: ${error.reason || error.message}`);
      addToTxHistory(`Error: ${error.reason || error.message}`);
    }
  };

  // Escrow: Fund a job
  const fundJob = async () => {
    if (!escrow || !jobId) {
      setTxStatus("Error: Please provide job ID");
      addToTxHistory("Error: Please provide job ID");
      return;
    }
    try {
      setTxStatus("Pending: Funding job...");
      addToTxHistory("Pending: Funding job...");
      const job = await escrow.jobs(jobId);
      const amountToSend = job.amount;
      const tx = await escrow.fundJob(jobId, { value: amountToSend });
      setTxStatus("Pending: Waiting for confirmation...");
      addToTxHistory("Pending: Waiting for confirmation...");
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return escrow.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(e => e && e.name === "JobFunded");
      if (event) {
        setTxStatus(`Success: Job ID ${jobId} funded`);
        addToTxHistory(`Success: Job ID ${jobId} funded`);
        await fetchJobs(); // Refresh jobs
      } else {
        setTxStatus("Error: Job funding failed: No JobFunded event");
        addToTxHistory("Error: Job funding failed: No JobFunded event");
      }
    } catch (error) {
      console.error("Fund job failed:", error);
      setTxStatus(`Error: ${error.reason || error.message}`);
      addToTxHistory(`Error: ${error.reason || error.message}`);
    }
  };

  // Escrow: Submit delivery
  const submitDelivery = async () => {
    if (!escrow || !file || !jobId) {
      setTxStatus("Error: Please provide a file and job ID");
      addToTxHistory("Error: Please provide a file and job ID");
      return;
    }
    try {
      setTxStatus("Uploading file to Pinata...");
      addToTxHistory("Uploading file to Pinata...");
      const ipfsHash = await uploadToPinata(file);
      const fileUrl = `${PINATA_GATEWAY}${ipfsHash}`;
      setDeliveryUrl(fileUrl);
      setTxStatus(`Success: File uploaded to Pinata: ${ipfsHash}`);
      addToTxHistory(`Success: File uploaded to Pinata: ${ipfsHash}`);

      setTxStatus("Pending: Submitting delivery...");
      addToTxHistory("Pending: Submitting delivery...");
      const tx = await escrow.submitDelivery(jobId, ipfsHash);
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => escrow.interface.parseLog(log))
        .find(e => e.name === "DeliverySubmitted");
      if (event) {
        setTxStatus(`Success: Delivery submitted for Job ID: ${jobId}`);
        addToTxHistory(`Success: Delivery submitted for Job ID: ${jobId}`);
        await fetchJobs(); // Refresh jobs
      } else {
        setTxStatus("Error: Delivery submission failed: No DeliverySubmitted event");
        addToTxHistory("Error: Delivery submission failed: No DeliverySubmitted event");
      }
    } catch (error) {
      console.error("Submit delivery failed:", error);
      setTxStatus(`Error: ${error.message}`);
      addToTxHistory(`Error: ${error.message}`);
    }
  };

  // File input handler
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Escrow: Confirm delivery
  const confirmDelivery = async () => {
    if (!escrow || !jobId) {
      setTxStatus("Error: Please provide job ID");
      addToTxHistory("Error: Please provide job ID");
      return;
    }
    try {
      setTxStatus("Pending: Confirming delivery...");
      addToTxHistory("Pending: Confirming delivery...");
      const tx = await escrow.confirmDelivery(jobId);
      await tx.wait();
      setTxStatus("Success: Delivery confirmed and payment released!");
      addToTxHistory("Success: Delivery confirmed and payment released!");
      await fetchJobs(); // Refresh jobs
      await fetchRep();  // Refresh reputation balance
    } catch (error) {
      console.error("Confirm delivery failed:", error);
      setTxStatus(`Error: ${error.reason || error.message}`);
      addToTxHistory(`Error: ${error.reason || error.message}`);
    }
  };

  // Escrow: Initiate dispute
  const disputeJob = async () => {
    if (!escrow || !jobId) {
      setTxStatus("Error: Please provide job ID");
      addToTxHistory("Error: Please provide job ID");
      return;
    }
    try {
      setTxStatus("Pending: Initiating dispute...");
      addToTxHistory("Pending: Initiating dispute...");
      const tx = await escrow.dispute(jobId);
      await tx.wait();
      setTxStatus("Success: Dispute initiated!");
      addToTxHistory("Success: Dispute initiated!");
      await fetchJobs(); // Refresh jobs
      await fetchRep();  // Refresh reputation balance
    } catch (error) {
      console.error("Dispute job failed:", error);
      setTxStatus(`Error: ${error.reason || error.message}`);
      addToTxHistory(`Error: ${error.reason || error.message}`);
    }
  };

  // DAO: Create dispute
  const createDispute = async () => {
    if (!dao || !freelancer) {
      setTxStatus("Error: Please provide freelancer address");
      addToTxHistory("Error: Please provide freelancer address");
      return;
    }
    if (!ethers.isAddress(freelancer)) {
      setTxStatus("Error: Invalid freelancer address");
      addToTxHistory("Error: Invalid freelancer address");
      return;
    }
    try {
      setTxStatus("Pending: Creating dispute...");
      addToTxHistory("Pending: Creating dispute...");
      const tx = await dao.createDispute(freelancer, "Dispute reason", { value: ethers.parseEther("0.05") });
      setTxStatus("Pending: Waiting for confirmation...");
      addToTxHistory("Pending: Waiting for confirmation...");
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => {
          try {
            return dao.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(e => e && e.name === "DisputeCreated");
      if (event) {
        setDisputeId(event.args.disputeId.toString());
        setTxStatus(`Success: Dispute created with ID: ${event.args.disputeId}`);
        addToTxHistory(`Success: Dispute created with ID: ${event.args.disputeId}`);
      } else {
        setTxStatus("Error: Dispute creation failed: No DisputeCreated event");
        addToTxHistory("Error: Dispute creation failed: No DisputeCreated event");
      }
    } catch (error) {
      console.error("Create dispute failed:", error);
      setTxStatus(`Error: ${error.reason || error.message}`);
      addToTxHistory(`Error: ${error.reason || error.message}`);
    }
  };

  // DAO: Register as juror
  const registerAsJuror = async () => {
    if (!dao) {
      setTxStatus("Error: DAO not initialized");
      addToTxHistory("Error: DAO not initialized");
      return;
    }
    try {
      setTxStatus("Pending: Registering as juror...");
      addToTxHistory("Pending: Registering as juror...");
      const tx = await dao.registerAsJuror();
      await tx.wait();
      setTxStatus("Success: Registered as juror!");
      addToTxHistory("Success: Registered as juror!");
    } catch (error) {
      console.error("Register juror failed:", error);
      setTxStatus(`Error: ${error.reason || error.message}`);
      addToTxHistory(`Error: ${error.reason || error.message}`);
    }
  };

  // DAO: Vote on dispute
  const voteOnDispute = async () => {
    if (!dao || !disputeId || !voteOption) {
      setTxStatus("Error: Please provide dispute ID and select a vote option");
      addToTxHistory("Error: Please provide dispute ID and select a vote option");
      return;
    }
    try {
      setTxStatus("Pending: Casting vote...");
      addToTxHistory("Pending: Casting vote...");
      const voteEnum = voteOption === "Client" ? 1 : 2;
      const tx = await dao.voteOnDispute(disputeId, voteEnum);
      await tx.wait();
      setTxStatus("Success: Vote cast!");
      addToTxHistory("Success: Vote cast!");
    } catch (error) {
      console.error("Vote on dispute failed:", error);
      setTxStatus(`Error: ${error.reason || error.message}`);
      addToTxHistory(`Error: ${error.reason || error.message}`);
    }
  };

  // File upload handler
  const onFileChange = e => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="App" style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>Decentralized Freelance Marketplace</h1>
      <div style={{ marginBottom: 16 }}>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          style={{ marginRight: 8 }}
        >
          {HARDHAT_ACCOUNTS.map((acc) => (
            <option key={acc.address} value={acc.address}>
              {acc.label}
            </option>
          ))}
        </select>
        <button onClick={connectWallet}>
          {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
        </button>
      </div>
      {txStatus && <p style={{ color: txStatus.startsWith("Error") ? "red" : "green" }}>{txStatus}</p>}
      {account && (
        <div>
          <p>Logged in as: <strong>{role}</strong></p>
<h2>Reputation Token Balance: {repBalance}</h2>
          <hr />

          <h3>Active Jobs</h3>
          {jobs.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Job ID</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Client</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Freelancer</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Amount (ETH)</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Delivery URL</th>
                </tr>
              </thead>
              <tbody>

{jobs
  .filter(job => {
    if (role === "Client") return job.client.toLowerCase() === selectedAccount.toLowerCase();
    if (role === "Freelancer") return job.freelancer.toLowerCase() === selectedAccount.toLowerCase();
    return true;
  })
  .map(job => (
    <tr key={job.id}>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.id}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.client.slice(0, 6)}...{job.client.slice(-4)}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.amount}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>
        <span style={{
          padding: "4px 8px",
          borderRadius: "12px",
          backgroundColor:
            job.status === "Created" ? "#007bff" :
            job.status === "Funded" ? "#fd7e14" :
            job.status === "Delivered" ? "#ffc107" :
            job.status === "Confirmed" ? "#28a745" :
            job.status === "Disputed" ? "#dc3545" :
            job.status === "Resolved" ? "#6c757d" : "#999",
          color: "white",
          fontSize: "0.9em"
        }}>
          {job.status}
        </span>
      </td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>
        {job.deliveryUrl ? (
          <a href={`https://gateway.pinata.cloud/ipfs/${job.deliveryUrl}`} target="_blank" rel="noopener noreferrer">
            View Delivery
          </a>
        ) : (
          "N/A"
        )}
        {role === "Client" && job.status === "Created" && (
          <button onClick={() => { setJobId(job.id); fundJob(); }}>Fund</button>
        )}
        {role === "Freelancer" && job.status === "Funded" && (
          <>
            <input type="file" onChange={onFileChange} style={{ display: "block", margin: "8px 0" }} />
            <button onClick={() => { setJobId(job.id); submitDelivery(); }}>Submit Delivery</button>
          </>
        )}
        {role === "Client" && job.status === "Delivered" && (
          <button onClick={() => { setJobId(job.id); confirmDelivery(); }}>Confirm</button>
        )}
        {(role === "Client" || role === "Freelancer") && job.status === "Delivered" && (
          <button onClick={() => { setJobId(job.id); disputeJob(); }}>Dispute</button>
        )}
      </td>
    </tr>
  ))}
</tbody>

            </table>
          ) : (
            <p>No active jobs found.</p>
          )}

          <hr />
          <h3>Create New Job</h3>
          <input
            placeholder="Freelancer Address (e.g., 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)"
            value={freelancer}
            onChange={e => setFreelancer(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <input
            placeholder="Amount (e.g., 1.5 ETH)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button onClick={createJob}>Create Job</button>

          <hr />
          <h3>Fund Job</h3>
          <input
            placeholder="Job ID (e.g., 1)"
            value={jobId}
            onChange={e => setJobId(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button onClick={fundJob}>Fund Job</button>

          <hr />
          <h3>Submit Delivery</h3>
          <input type="file" onChange={onFileChange} style={{ marginBottom: 8 }} />
          <button onClick={submitDelivery}>Submit Delivery</button>
          {deliveryUrl && (
            <div>
              <a href={deliveryUrl} target="_blank" rel="noopener noreferrer">
                View Uploaded File
              </a>
            </div>
          )}

          <hr />
          <h3>Confirm Delivery</h3>
          <input
            placeholder="Job ID (e.g., 1)"
            value={jobId}
            onChange={e => setJobId(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button onClick={confirmDelivery}>Confirm Delivery</button>

          <hr />
          <h3>Dispute Job</h3>
          <input
            placeholder="Job ID (e.g., 1)"
            value={jobId}
            onChange={e => setJobId(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button onClick={disputeJob}>Dispute</button>

          <hr />
          <h3>Recent Transactions</h3>
          {txHistory.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {txHistory.map((tx, index) => (
                <li
                  key={index}
                  style={{
                    padding: 8,
                    background: tx.startsWith("Error") ? "#ffe6e6" : "#e6ffe6",
                    marginBottom: 4,
                    borderRadius: 4,
                  }}
                >
                  {tx}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent transactions.</p>
          )}

          <hr />
          <h3>DAO: Dispute Resolution</h3>
          <button onClick={registerAsJuror}>Register as Juror</button>
          <br /><br />
          <button onClick={createDispute}>Create Dispute (Demo)</button>
          <input
            placeholder="Dispute ID (e.g., 1)"
            value={disputeId}
            onChange={e => setDisputeId(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <select value={voteOption} onChange={e => setVoteOption(e.target.value)} style={{ width: "100%" }}>
            <option value="">Select Vote</option>
            <option value="Client">Vote Client</option>
            <option value="Freelancer">Vote Freelancer</option>
          </select>
          <button onClick={voteOnDispute}>Vote</button>

          <hr />
          <h3>Open Disputes</h3>
          {disputes.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Dispute ID</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Client</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Freelancer</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Reason</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Votes (Client)</th>
                  <th style={{ padding: 8, border: "1px solid #ddd" }}>Votes (Freelancer)</th>
                </tr>
              </thead>
              <tbody>
{jobs
  .filter(job => {
    if (role === "Client") return job.client.toLowerCase() === selectedAccount.toLowerCase();
    if (role === "Freelancer") return job.freelancer.toLowerCase() === selectedAccount.toLowerCase();
    return true;
  })
  .map(job => (
    <tr key={job.id}>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.id}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.client.slice(0, 6)}...{job.client.slice(-4)}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.amount}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>
        <span style={{
          padding: "4px 8px",
          borderRadius: "12px",
          backgroundColor:
            job.status === "Created" ? "#007bff" :
            job.status === "Funded" ? "#fd7e14" :
            job.status === "Delivered" ? "#ffc107" :
            job.status === "Confirmed" ? "#28a745" :
            job.status === "Disputed" ? "#dc3545" :
            job.status === "Resolved" ? "#6c757d" : "#999",
          color: "white",
          fontSize: "0.9em"
        }}>
          {job.status}
        </span>
      </td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>
        {job.deliveryUrl ? (
          <a href={`https://gateway.pinata.cloud/ipfs/${job.deliveryUrl}`} target="_blank" rel="noopener noreferrer">
            View Delivery
          </a>
        ) : (
          "N/A"
        )}
        {role === "Client" && job.status === "Created" && (
          <button onClick={() => { setJobId(job.id); fundJob(); }}>Fund</button>
        )}
        {role === "Freelancer" && job.status === "Funded" && (
          <>
            <input type="file" onChange={onFileChange} style={{ display: "block", margin: "8px 0" }} />
            <button onClick={() => { setJobId(job.id); submitDelivery(); }}>Submit Delivery</button>
          </>
        )}
        {role === "Client" && job.status === "Delivered" && (
          <button onClick={() => { setJobId(job.id); confirmDelivery(); }}>Confirm</button>
        )}
        {(role === "Client" || role === "Freelancer") && job.status === "Delivered" && (
          <button onClick={() => { setJobId(job.id); disputeJob(); }}>Dispute</button>
        )}
      </td>
    </tr>
  ))}
</tbody>
            </table>
          ) : (
            <p>No open disputes found.</p>
          )}
        </div>
      )}
    
{selectedAccount === "0xArbitratorAddress" && (
  <>
    <hr />
    <h3>Arbitrator: Resolve Disputes</h3>
    {disputedJobs.length > 0 ? (
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Job ID</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Client</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Freelancer</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Amount</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Action</th>
          </tr>
        </thead>
        <tbody>
{jobs
  .filter(job => {
    if (role === "Client") return job.client.toLowerCase() === selectedAccount.toLowerCase();
    if (role === "Freelancer") return job.freelancer.toLowerCase() === selectedAccount.toLowerCase();
    return true;
  })
  .map(job => (
    <tr key={job.id}>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.id}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.client.slice(0, 6)}...{job.client.slice(-4)}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>{job.amount}</td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>
        <span style={{
          padding: "4px 8px",
          borderRadius: "12px",
          backgroundColor:
            job.status === "Created" ? "#007bff" :
            job.status === "Funded" ? "#fd7e14" :
            job.status === "Delivered" ? "#ffc107" :
            job.status === "Confirmed" ? "#28a745" :
            job.status === "Disputed" ? "#dc3545" :
            job.status === "Resolved" ? "#6c757d" : "#999",
          color: "white",
          fontSize: "0.9em"
        }}>
          {job.status}
        </span>
      </td>
      <td style={{ padding: 8, border: "1px solid #FFD700" }}>
        {job.deliveryUrl ? (
          <a href={`https://gateway.pinata.cloud/ipfs/${job.deliveryUrl}`} target="_blank" rel="noopener noreferrer">
            View Delivery
          </a>
        ) : (
          "N/A"
        )}
        {role === "Client" && job.status === "Created" && (
          <button onClick={() => { setJobId(job.id); fundJob(); }}>Fund</button>
        )}
        {role === "Freelancer" && job.status === "Funded" && (
          <>
            <input type="file" onChange={onFileChange} style={{ display: "block", margin: "8px 0" }} />
            <button onClick={() => { setJobId(job.id); submitDelivery(); }}>Submit Delivery</button>
          </>
        )}
        {role === "Client" && job.status === "Delivered" && (
          <button onClick={() => { setJobId(job.id); confirmDelivery(); }}>Confirm</button>
        )}
        {(role === "Client" || role === "Freelancer") && job.status === "Delivered" && (
          <button onClick={() => { setJobId(job.id); disputeJob(); }}>Dispute</button>
        )}
      </td>
    </tr>
  ))}
</tbody>
      </table>
    ) : (
      <p>No disputed jobs to resolve.</p>
    )}
  </>
)}
</div>
  );
}

export default App;
