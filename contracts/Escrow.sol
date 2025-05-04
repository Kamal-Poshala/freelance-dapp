// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ReputationToken.sol"; // Import ReputationToken contract

contract Escrow is ReentrancyGuard {
    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;
    ReputationToken public repToken; // Reference to ReputationToken contract
    uint256 public constant REP_REWARD = 10 ether; // 10 REP tokens (assuming 18 decimals)

    struct Job {
        address client;
        address freelancer;
        uint256 amount;
        uint256 status; // 0: Created, 1: Funded, 2: Delivered, 3: Confirmed, 4: Disputed
        string deliveryUrl; // IPFS URL for delivery
        bool repMinted; // Track if REP tokens were minted
    }

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event DeliverySubmitted(uint256 indexed jobId, string deliveryUrl);
    event DeliveryConfirmed(uint256 indexed jobId);
    event JobDisputed(uint256 indexed jobId);

    constructor(address _repTokenAddress) {
        require(_repTokenAddress != address(0), "Invalid ReputationToken address");
        repToken = ReputationToken(_repTokenAddress);
    }

    function createJob(address freelancer, uint256 amount) external returns (uint256) {
        require(freelancer != address(0), "Invalid freelancer address");
        require(amount > 0, "Amount must be > 0");
        jobCount++;
        jobs[jobCount] = Job({
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            status: 0, // Created
            deliveryUrl: "",
            repMinted: false // Initialize repMinted
        });
        emit JobCreated(jobCount, msg.sender, freelancer, amount);
        return jobCount;
    }

    function fundJob(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Only client can fund");
        require(job.status == 0, "Job not in Created state");
        require(msg.value == job.amount, "Incorrect amount");
        job.status = 1; // Funded
        emit JobFunded(jobId, msg.value);
    }

    function submitDelivery(uint256 jobId, string memory deliveryUrl) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.freelancer == msg.sender, "Only freelancer can submit");
        require(job.status == 1, "Job not in Funded state");
        job.deliveryUrl = deliveryUrl; // Store the IPFS URL
        job.status = 2; // Delivered (not Disputed)
        emit DeliverySubmitted(jobId, deliveryUrl);
    }

    function confirmDelivery(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Only client can confirm");
        require(job.status == 2, "Job not in Delivered state");
        // Mint REP tokens to freelancer
        if (!job.repMinted) {
            repToken.mint(job.freelancer, REP_REWARD);
            job.repMinted = true;
        }
        // Release payment to freelancer
        (bool sent, ) = job.freelancer.call{value: job.amount}("");
        require(sent, "Payment failed");
        job.status = 3; // Confirmed
        emit DeliveryConfirmed(jobId);
    }

    function dispute(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender || job.freelancer == msg.sender, "Only client or freelancer can dispute");
        require(job.status == 2 || job.status == 3, "Job must be in Delivered or Confirmed state");
        // If REP tokens were minted (i.e., job was Confirmed), burn them
        if (job.status == 3 && job.repMinted) {
            repToken.burn(job.freelancer, REP_REWARD);
            job.repMinted = false;
        }
        job.status = 4; // Disputed
        emit JobDisputed(jobId);
    }

    //Refund function for arbiter or DAO resolution (Optional)
    function refund(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.status == 4, "Job not in Disputed state");
        // Add arbiter or DAO check if needed
        (bool sent, ) = job.client.call{value: job.amount}("");
        require(sent, "Refund failed");
        job.status = 3; // Confirmed (or add new Refunded status)
    }
}