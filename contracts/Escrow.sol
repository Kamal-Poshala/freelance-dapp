// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Escrow {
    enum State { AwaitingPayment, AwaitingDelivery, Complete, Refunded }

    address public client;
    address public freelancer;
    uint public amount;
    State public currentState;

    constructor(address _freelancer) payable {
        client = msg.sender;
        freelancer = _freelancer;
        amount = msg.value;
        currentState = State.AwaitingDelivery;
    }

    modifier onlyClient() {
        require(msg.sender == client, "Only client can call this.");
        _;
    }

    modifier inState(State expected) {
        require(currentState == expected, "Invalid state.");
        _;
    }

    function confirmDelivery() external onlyClient inState(State.AwaitingDelivery) {
        currentState = State.Complete;
        payable(freelancer).transfer(amount);
    }

    function refundClient() external onlyClient inState(State.AwaitingDelivery) {
        currentState = State.Refunded;
        payable(client).transfer(amount);
    }

    function getStatus() external view returns (string memory) {
        if (currentState == State.AwaitingDelivery) return "Awaiting Delivery";
        if (currentState == State.Complete) return "Complete";
        if (currentState == State.Refunded) return "Refunded";
        return "Awaiting Payment";
    }
}
