// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EscrowFactory {
    enum State { AwaitingDelivery, Complete, Refunded, Disputed, Resolved }

    struct Job {
        address client;
        address freelancer;
        uint256 amount;
        State currentState;
    }

    uint256 public jobCounter;
    mapping(uint256 => Job) public jobs;

    address public arbitrator;  // Placeholder DAO or trusted contract for now

    event JobCreated(uint256 jobId, address client, address freelancer, uint256 amount);
    event DeliveryConfirmed(uint256 jobId);
    event Refunded(uint256 jobId);
    event DisputeRaised(uint256 jobId);
    event JobResolved(uint256 jobId, address winner);

    constructor(address _arbitrator) {
        arbitrator = _arbitrator;
    }

    modifier onlyClient(uint256 jobId) {
        require(msg.sender == jobs[jobId].client, "Only client can call this.");
        _;
    }

    modifier onlyInvolved(uint256 jobId) {
        require(
            msg.sender == jobs[jobId].client || msg.sender == jobs[jobId].freelancer,
            "Not involved in this job."
        );
        _;
    }

    modifier inState(uint256 jobId, State expected) {
        require(jobs[jobId].currentState == expected, "Invalid state.");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator can call this.");
        _;
    }

    function createJob(address _freelancer) external payable returns (uint256) {
        require(msg.value > 0, "Must send payment");

        jobs[jobCounter] = Job({
            client: msg.sender,
            freelancer: _freelancer,
            amount: msg.value,
            currentState: State.AwaitingDelivery
        });

        emit JobCreated(jobCounter, msg.sender, _freelancer, msg.value);
        return jobCounter++;
    }

    function confirmDelivery(uint256 jobId)
        external
        onlyClient(jobId)
        inState(jobId, State.AwaitingDelivery)
    {
        Job storage job = jobs[jobId];
        job.currentState = State.Complete;
        payable(job.freelancer).transfer(job.amount);
        emit DeliveryConfirmed(jobId);
    }

    function refundClient(uint256 jobId)
        external
        onlyClient(jobId)
        inState(jobId, State.AwaitingDelivery)
    {
        Job storage job = jobs[jobId];
        job.currentState = State.Refunded;
        payable(job.client).transfer(job.amount);
        emit Refunded(jobId);
    }

    function raiseDispute(uint256 jobId)
        external
        onlyInvolved(jobId)
        inState(jobId, State.AwaitingDelivery)
    {
        jobs[jobId].currentState = State.Disputed;
        emit DisputeRaised(jobId);
    }

    function resolveDispute(uint256 jobId, address winner)
        external
        onlyArbitrator
        inState(jobId, State.Disputed)
    {
        require(
            winner == jobs[jobId].client || winner == jobs[jobId].freelancer,
            "Winner must be client or freelancer"
        );

        jobs[jobId].currentState = State.Resolved;
        payable(winner).transfer(jobs[jobId].amount);
        emit JobResolved(jobId, winner);
    }
}
