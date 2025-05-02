// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {
    uint256 public jobCount;
    address public arbitrator;

    constructor(address _arbitrator) {
        require(_arbitrator != address(0), "Invalid arbitrator address");
        arbitrator = _arbitrator;
    }

    enum JobStatus { Created, Funded, Delivered, Confirmed, Disputed, Resolved }

    struct Job {
        address client;
        address freelancer;
        uint256 amount;
        JobStatus status;
        string deliveryUrl;
    }

    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event DeliverySubmitted(uint256 indexed jobId, string deliveryUrl);
    event DeliveryConfirmed(uint256 indexed jobId);
    event JobDisputed(uint256 indexed jobId);
    event JobResolved(uint256 indexed jobId, address recipient);

    function createJob(address freelancer, uint256 amount) external returns (uint256) {
        require(freelancer != address(0), "Invalid freelancer address");
        require(amount > 0, "Amount must be > 0");

        jobCount++;
        jobs[jobCount] = Job({
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            status: JobStatus.Created,
            deliveryUrl: ""
        });

        emit JobCreated(jobCount, msg.sender, freelancer, amount);
        return jobCount;
    }

    function fundJob(uint256 jobId) external payable nonReentrant {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Only client can fund");
        require(job.status == JobStatus.Created, "Job not in Created state");
        require(msg.value == job.amount, "Incorrect amount");

        job.status = JobStatus.Funded;
        emit JobFunded(jobId, msg.value);
    }

    function submitDelivery(uint256 jobId, string memory deliveryUrl) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.freelancer == msg.sender, "Only freelancer can submit");
        require(job.status == JobStatus.Funded, "Job not in Funded state");

        job.deliveryUrl = deliveryUrl;
        job.status = JobStatus.Delivered;
        emit DeliverySubmitted(jobId, deliveryUrl);
    }

    function confirmDelivery(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(job.client == msg.sender, "Only client can confirm");
        require(job.status == JobStatus.Delivered, "Job not in Delivered state");

        (bool sent, ) = job.freelancer.call{value: job.amount}("");
        require(sent, "Payment failed");

        job.status = JobStatus.Confirmed;
        emit DeliveryConfirmed(jobId);
    }

    function dispute(uint256 jobId) external nonReentrant {
        Job storage job = jobs[jobId];
        require(
            msg.sender == job.client || msg.sender == job.freelancer,
            "Only client or freelancer can dispute"
        );
        require(job.status == JobStatus.Delivered, "Job not in Delivered state");

        job.status = JobStatus.Disputed;
        emit JobDisputed(jobId);
    }

    function resolveDispute(uint256 jobId, bool releaseToFreelancer) external nonReentrant {
        Job storage job = jobs[jobId];
        require(msg.sender == arbitrator, "Only arbitrator can resolve");
        require(job.status == JobStatus.Disputed, "Job not in Disputed state");

        address recipient = releaseToFreelancer ? job.freelancer : job.client;
        (bool sent, ) = recipient.call{value: job.amount}("");
        require(sent, "Transfer failed");

        job.status = JobStatus.Resolved;
        emit JobResolved(jobId, recipient);
    }
}
