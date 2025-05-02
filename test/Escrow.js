const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract", function () {
  let escrow, deployer, client, freelancer;
  const mockDeliveryUrl = "QmMockHash"; // Mock IPFS hash for testing

  beforeEach(async function () {
    [deployer, client, freelancer] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();
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
  });

  it("should allow client to confirm delivery and pay freelancer", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;

    await escrow.connect(client).fundJob(jobId, { value: amount });
    await escrow.connect(freelancer).submitDelivery(jobId, mockDeliveryUrl);
    const initialBalance = await ethers.provider.getBalance(freelancer.address);
    await escrow.connect(client).confirmDelivery(jobId);
    const job = await escrow.jobs(jobId);
    expect(job.status).to.equal(3); // Confirmed
    const finalBalance = await ethers.provider.getBalance(freelancer.address);
    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("should allow client or freelancer to dispute a job", async function () {
    const amount = ethers.parseEther("1.5");
    const tx = await escrow.connect(client).createJob(freelancer.address, amount);
    const receipt = await tx.wait();
    const jobId = receipt.logs
      .map(log => escrow.interface.parseLog(log))
      .find(e => e.name === "JobCreated").args.jobId;

    await escrow.connect(client).fundJob(jobId, { value: amount });
    await escrow.connect(freelancer).submitDelivery(jobId, mockDeliveryUrl);
    await escrow.connect(client).dispute(jobId);
    const job = await escrow.jobs(jobId);
    expect(job.status).to.equal(4); // Disputed
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