const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationToken (ERC20)", function () {
  let ReputationToken, rep, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ReputationToken = await ethers.getContractFactory("ReputationToken");
    rep = await ReputationToken.deploy("Reputation Token", "RPT", owner.address);
    await rep.waitForDeployment();
    console.log("ReputationToken deployed at:", rep.target);
  });

  it("should assign no tokens at deployment", async function () {
    expect(await rep.totalSupply()).to.equal(0);
  });

  it("should allow only admin to mint", async function () {
    await rep.connect(owner).mint(user1.address, 100);
    expect(await rep.balanceOf(user1.address)).to.equal(100);

    await expect(
      rep.connect(user1).mint(user2.address, 50)
    ).to.be.revertedWith("Only owner can call this function");
  });

  it("should allow transfer if enabled", async function () {
    await rep.connect(owner).mint(user1.address, 100);
    await rep.connect(user1).transfer(user2.address, 40);
    expect(await rep.balanceOf(user2.address)).to.equal(40);
    expect(await rep.balanceOf(user1.address)).to.equal(60);
  });

  it("should not allow transfer more than balance", async function () {
    await rep.connect(owner).mint(user1.address, 100);
    await expect(
      rep.connect(user1).transfer(user2.address, 200)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("should not allow minting to zero address", async function () {
    await expect(
      rep.connect(owner).mint("0x0000000000000000000000000000000000000000", 100)
    ).to.be.revertedWith("ERC20: mint to the zero address");
  });

  it("should not allow transfer to zero address", async function () {
    await rep.connect(owner).mint(user1.address, 100);
    await expect(
      rep.connect(user1).transfer("0x0000000000000000000000000000000000000000", 10)
    ).to.be.revertedWithCustomError(rep, "ERC20InvalidReceiver");
  });
});