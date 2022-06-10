const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("GoldToken", function() {
  let [accountA, accountB, accountC] = [];
  let goldToken;
  const amount = ethers.utils.parseUnits("100", "ether");
  const totalSupply = 1000000;
  const totalSupplyWei = ethers.utils.parseUnits(totalSupply.toString(), "ether");
  beforeEach(async () => {
    [accountA, accountB, accountC] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("GoldToken");
    goldToken = await Token.deploy(totalSupply);
    await goldToken.deployed();
  });
  describe("common", function() {
    it("should have a total supply of 1000000", async function() {
      expect(await goldToken.totalSupply()).to.be.equal(totalSupplyWei);
    });
    it("should have a balance of 1000000 for accountA", async function() {
      expect(await goldToken.balanceOf(accountA.address)).to.be.equal(totalSupplyWei);
    });
    it("should have a balance of 0 for accountB", async function() {
      expect(await goldToken.balanceOf(accountB.address)).to.be.equal(0);
    });
    it("should have a balance of 0 for accountC", async function() {
      expect(await goldToken.balanceOf(accountC.address)).to.be.equal(0);
    });
    it("allowance should be 0 for accountA and accountB", async function() {
      expect(await goldToken.allowance(accountA.address, accountB.address)).to.be.equal(0);
    });
  });
  describe("pause()", function() {
    it("should be revert if not pause role", async function() {
      await expect(goldToken.connect(accountB).pause()).to.be.reverted;
    });
    it("should be revert if paused", async function() {
      await goldToken.connect(accountA).pause();
      await expect(goldToken.connect(accountA).pause()).to.be.reverted;
    });
    it("should be pause contract correctly", async function() {
      const pauseTx = await goldToken.connect(accountA).pause();
      await expect(pauseTx).to.be.emit(goldToken, "Paused")
      .withArgs(accountA.address);
      await expect(goldToken.transfer(accountB.address, amount)).to.be
      .revertedWith("Pausable: paused");
    });
  });
  describe("unpause()", function() {
    it("should be revert if not pause role", async function() {
      await expect(goldToken.connect(accountB).unpause()).to.be.reverted;
    });
    it("should be revert if contract has been unpaused", async function() {
      await expect(goldToken.unpause()).to.be.revertedWith("Pausable: not paused");
    });
    it("should be unpause contract correctly", async function() {
      await goldToken.connect(accountA).pause();
      const unpauseTx = await goldToken.connect(accountA).unpause();
      await expect(unpauseTx).to.be.emit(goldToken, "Unpaused")
      .withArgs(accountA.address);
      const transferTx = await goldToken.connect(accountA).transfer(accountB.address, amount);
      await expect(transferTx).to.emit(goldToken, "Transfer")
      .withArgs(accountA.address, accountB.address, amount);
    });
  });
  describe("addToBlackList()", function() {
    it("should be revert if not admin role", async function() {
      await expect(goldToken.connect(accountB).addToBlackList(accountC.address)).to.be.reverted;
    });
    it("should be revert if account is sender", async function() {
      await expect(goldToken.connect(accountA).addToBlackList(accountA.address)).to.be.reverted;
    });
    it("should be revert if account is already in the black list", async function() {
      await goldToken.connect(accountA).addToBlackList(accountB.address);
      await expect(goldToken.connect(accountA).addToBlackList(accountB.address)).to.be.reverted;
    });
    it("should be add to black list correctly", async function() {
      const addToBlackListTx = await goldToken.connect(accountA).addToBlackList(accountB.address);
      await expect(addToBlackListTx).to.emit(goldToken, "BlackListAdded").withArgs(accountB.address);
    });
  });
  describe("removeFromBlackList()", function() {
    it("should be revert if not admin role", async function() {
      await expect(goldToken.connect(accountB).removeFromBlackList(accountB.address)).to.be.reverted;
    });
    it("should be revert if account is sender", async function() {
      await expect(goldToken.connect(accountA).removeFromBlackList(accountA.address)).to.be.reverted
    });
    it("should be revert if account is not already in the black list", async function() {
      await expect(goldToken.removeFromBlackList(accountB.address)).to.be.reverted;
    });
    it("should be remove from the black list correctly", async function() {
      await goldToken.addToBlackList(accountB.address);
      await expect(goldToken.removeFromBlackList(accountB.address)).to.emit(goldToken, "BlackListRemoved")
        .withArgs(accountB.address);
    });
  });
});