const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAO Voting (Dispute Resolution)", function () {
  let dao, deployer, user1, user2;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();
    const DisputeDAO = await ethers.getContractFactory("DisputeDAO");
    dao = await DisputeDAO.deploy();
    await dao.waitForDeployment();
  });

  it("should allow users to submit a dispute", async function () {
    const reason = "Non-delivery of work";
    const tx = await dao.connect(user1).createDispute(user2.address, reason, { value: ethers.parseEther("0.05") });
    const receipt = await tx.wait();
    const disputeId = receipt.logs
      .map(log => dao.interface.parseLog(log))
      .find(e => e.name === "DisputeCreated").args.disputeId;
    const dispute = await dao.disputes(disputeId);
    expect(dispute.exists).to.be.true;
    expect(dispute.reason).to.equal(reason);
    expect(dispute.client).to.equal(user1.address);
    expect(dispute.freelancer).to.equal(user2.address);
  });

  it("should allow voting and resolve dispute with refund", async function () {
    const reason = "Non-delivery of work";
    const disputeFee = ethers.parseEther("0.05");
    const tx = await dao.connect(user1).createDispute(user2.address, reason, { value: disputeFee });
    const receipt = await tx.wait();
    const disputeId = receipt.logs
      .map(log => dao.interface.parseLog(log))
      .find(e => e.name === "DisputeCreated").args.disputeId;

    await dao.connect(user2).voteOnDispute(disputeId, 1); // Vote for client
    const dispute = await dao.disputes(disputeId);
    expect(dispute.votesClient).to.equal(1);
    expect(dispute.votesFreelancer).to.equal(0);

    const initialBalance = await ethers.provider.getBalance(user1.address);
    await dao.connect(user1).resolveDispute(disputeId);
    const resolvedDispute = await dao.disputes(disputeId);
    expect(resolvedDispute.resolved).to.be.true;
    expect(resolvedDispute.votesClient).to.be.gte(resolvedDispute.votesFreelancer);

    // Check that the client received the refund
    const finalBalance = await ethers.provider.getBalance(user1.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("should not allow double voting", async function () {
    const reason = "Non-delivery of work";
    const tx = await dao.connect(user1).createDispute(user2.address, reason, { value: ethers.parseEther("0.05") });
    const receipt = await tx.wait();
    const disputeId = receipt.logs
      .map(log => dao.interface.parseLog(log))
      .find(e => e.name === "DisputeCreated").args.disputeId;

    await dao.connect(user2).voteOnDispute(disputeId, 1);
    await expect(dao.connect(user2).voteOnDispute(disputeId, 1)).to.be.revertedWith("Already voted");
  });

  it("should not allow voting on non-existent dispute", async function () {
    await expect(dao.connect(user1).voteOnDispute(999, 1)).to.be.revertedWith("Dispute does not exist");
  });
});