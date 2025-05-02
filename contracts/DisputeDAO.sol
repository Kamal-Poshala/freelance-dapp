// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DisputeDAO {
    uint256 public disputeCount;
    mapping(uint256 => Dispute) public disputes;

    struct Dispute {
        uint256 jobId;
        address client;
        address freelancer;
        string reason;
        uint256 votesClient;
        uint256 votesFreelancer;
        mapping(address => bool) voted;
        bool resolved;
        bool exists;
    }

    event DisputeCreated(uint256 indexed disputeId, address indexed client, address indexed freelancer, string reason);
    event Voted(uint256 indexed disputeId, address indexed voter, uint256 vote);
    event DisputeResolved(uint256 indexed disputeId, bool resolvedInFavor);

    function createDispute(address freelancer, string memory reason) external payable returns (uint256) {
        require(freelancer != address(0), "Invalid freelancer address");
        require(msg.value >= 0.05 ether, "Minimum 0.05 ETH required");
        disputeCount++;
        Dispute storage d = disputes[disputeCount];
        d.jobId = disputeCount; // Use disputeId as jobId for simplicity
        d.client = msg.sender;
        d.freelancer = freelancer;
        d.reason = reason;
        d.votesClient = 0;
        d.votesFreelancer = 0;
        d.resolved = false;
        d.exists = true;
        emit DisputeCreated(disputeCount, msg.sender, freelancer, reason);
        return disputeCount;
    }

    function registerAsJuror() external {
        // Placeholder: Add juror registration logic (e.g., stake, eligibility)
    }

    function voteOnDispute(uint256 disputeId, uint256 vote) external {
        Dispute storage d = disputes[disputeId];
        require(d.exists, "Dispute does not exist");
        require(!d.voted[msg.sender], "Already voted");
        require(!d.resolved, "Dispute already resolved");
        require(vote == 1 || vote == 2, "Invalid vote: 1 for Client, 2 for Freelancer");
        d.voted[msg.sender] = true;
        if (vote == 1) {
            d.votesClient++;
        } else {
            d.votesFreelancer++;
        }
        emit Voted(disputeId, msg.sender, vote);
    }

    function resolveDispute(uint256 disputeId) external {
        Dispute storage d = disputes[disputeId];
        require(d.exists, "Dispute does not exist");
        require(!d.resolved, "Dispute already resolved");
        require(d.votesClient + d.votesFreelancer > 0, "No votes");
        d.resolved = true;
        bool resolvedInFavor = d.votesClient >= d.votesFreelancer;
        emit DisputeResolved(disputeId, resolvedInFavor);
        // Refund ETH to client if resolved in favor
        if (resolvedInFavor) {
            (bool sent, ) = d.client.call{value: address(this).balance}("");
            require(sent, "Refund failed");
        }
    }
}