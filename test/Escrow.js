const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract", function () {
  let escrow, repToken, deployer, client, freelancer;
  const mockDeliveryUrl = "QmMockHash"; // Mock IPFS hash for testing

  beforeEach(async function () {
    [deployer, client, freelancer] = await ethers.getSigners();

    // Deploy ReputationToken
    const ReputationToken = await ethers.getContractFactory("ReputationToken");
    repToken = await ReputationToken.deploy("Reputation Token", "RPT", deployer.address);
    await repToken.waitForDeployment();

    // Deploy Escrow with ReputationToken address
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(repToken.target);
    await escrow.waitForDeployment();

    // Grant MINTER_BURNER_ROLE to Escrow contract
    const MINTER_BURNER_ROLE = ethers.id("MINTER_BURNER_ROLE");
    await repToken.grantRole(MINTER_BURNER_ROLE, escrow.target);
  });

  it("should initialize with zero jobs", async function () {
    expect(await escrow.jobCount()).to.equal(0);
  });

  it("should allow client to create a job", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;
    const job = await escrow.jobs(jobId);
    expect(job.client).to.equal(client.address);
    expect(job.freelancer).to.equal(freelancer.address);
    expect(job.amount).to.equal(amount);
    expect(job.status).to.equal(0); // Created
    expect(job.repMinted).to.be.false;
  });

  it("should allow client to fund a job", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;

    await escrow.connect(client).fundJob(jobId, { value: amount });
    const job = await escrow.jobs(jobId);
    expect(job.status).to.equal(1); // Funded
    expect(job.repMinted).to.be.false;
  });

  it("should allow freelancer to submit delivery", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;

    await escrow.connect(client).fundJob(jobId, { value: amount });
    const submitTx = await escrow.connect(freelancer).submitDelivery(jobId, mockDeliveryUrl);
    const submitReceipt = await submitTx.wait();
    const event = submitReceipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "DeliverySubmitted");

    expect(event.args.jobId).to.equal(jobId);
    expect(event.args.deliveryUrl).to.equal(mockDeliveryUrl);

    const job = await escrow.jobs(jobId);
    expect(job.status).to.equal(2); // Delivered
    expect(job.deliveryUrl).to.equal(mockDeliveryUrl);
    expect(job.repMinted).to.be.false;
  });

  it("should allow client to confirm delivery, pay freelancer, and mint REP tokens", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;

    await escrow.connect(client).fundJob(jobId, { value: amount });
    await escrow.connect(freelancer).submitDelivery(jobId, mockDeliveryUrl);

    const initialBalance = await ethers.provider.getBalance(freelancer.address);
    const initialRepBalance = await repToken.balanceOf(freelancer.address);

    await escrow.connect(client).confirmDelivery(jobId);

    const job = await escrow.jobs(jobId);
    expect(job.status).to.equal(3); // Confirmed
    expect(job.repMinted).to.be.true;

    const finalBalance = await ethers.provider.getBalance(freelancer.address);
    expect(finalBalance).to.be.gt(initialBalance);

    const finalRepBalance = await repToken.balanceOf(freelancer.address);
    const repReward = ethers.parseEther("10"); // 10 REP tokens (18 decimals)
    expect(finalRepBalance).to.equal(initialRepBalance + repReward);
  });

  it("should allow client to dispute a job after delivery and not burn REP tokens if not confirmed", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;

    await escrow.connect(client).fundJob(jobId, { value: amount });
    await escrow.connect(freelancer).submitDelivery(jobId, mockDeliveryUrl);

    const initialRepBalance = await repToken.balanceOf(freelancer.address);

    await escrow.connect(client).dispute(jobId);
    const job = await escrow.jobs(jobId);
    expect(job.status).to.equal(4); // Disputed
    expect(job.repMinted).to.be.false;

    const finalRepBalance = await repToken.balanceOf(freelancer.address);
    expect(finalRepBalance).to.equal(initialRepBalance); // No REP tokens were minted, so none burned
  });

  it("should allow client to dispute a job after confirmation and burn REP tokens", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;

    await escrow.connect(client).fundJob(jobId, { value: amount });
    await escrow.connect(freelancer).submitDelivery(jobId, mockDeliveryUrl);
    await escrow.connect(client).confirmDelivery(jobId);

    const jobAfterConfirm = await escrow.jobs(jobId);
    expect(jobAfterConfirm.status).to.equal(3); // Confirmed
    expect(jobAfterConfirm.repMinted).to.be.true;

    const repBalanceAfterConfirm = await repToken.balanceOf(freelancer.address);
    const repReward = ethers.parseEther("10"); // 10 REP tokens
    expect(repBalanceAfterConfirm).to.equal(repReward);

    await escrow.connect(client).dispute(jobId);
    const jobAfterDispute = await escrow.jobs(jobId);
    expect(jobAfterDispute.status).to.equal(4); // Disputed
    expect(jobAfterDispute.repMinted).to.be.false;

    const repBalanceAfterDispute = await repToken.balanceOf(freelancer.address);
    expect(repBalanceAfterDispute).to.equal(0); // REP tokens burned
  });

  it("should allow refund in disputed state", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;

    await escrow.connect(client).fundJob(jobId, { value: amount });
    await escrow.connect(freelancer).submitDelivery(jobId, mockDeliveryUrl);
    await escrow.connect(client).dispute(jobId);

    const initialBalance = await ethers.provider.getBalance(client.address);
    await escrow.connect(client).refund(jobId); // Note: Update with DAO integration
    const job = await escrow.jobs(jobId);
    expect(job.status).to.equal(3); // Confirmed (or update to Refunded)
    const finalBalance = await ethers.provider.getBalance(client.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });
});