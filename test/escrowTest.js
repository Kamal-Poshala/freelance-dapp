const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract", function () {
  let Escrow, escrow, client, freelancer;

  beforeEach(async function () {
    [client, freelancer, _] = await ethers.getSigners();

    Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.connect(client).deploy(freelancer.address, {
      value: ethers.parseEther("1"),
    });

    // No need for .deployed() in Hardhat v3+
  });

  it("should initialize with correct state", async function () {
    expect(await escrow.client()).to.equal(client.address);
    expect(await escrow.freelancer()).to.equal(freelancer.address);
    expect(await escrow.amount()).to.equal(ethers.parseEther("1"));
    expect(await escrow.getStatus()).to.equal("Awaiting Delivery");
  });

  it("should allow client to confirm delivery and pay freelancer", async function () {
    const initialBalance = await ethers.provider.getBalance(freelancer.address);

    const tx = await escrow.connect(client).confirmDelivery();
    await tx.wait();

    expect(await escrow.getStatus()).to.equal("Complete");

    const newBalance = await ethers.provider.getBalance(freelancer.address);
    expect(newBalance).to.be.above(initialBalance); // freelancer received ETH
  });

  it("should allow client to refund", async function () {
    const refundTx = await escrow.connect(client).refundClient();
    await refundTx.wait();

    expect(await escrow.getStatus()).to.equal("Refunded");
  });

  it("should not allow freelancer to confirm delivery", async function () {
    await expect(
      escrow.connect(freelancer).confirmDelivery()
    ).to.be.revertedWith("Only client can call this.");
  });
});
