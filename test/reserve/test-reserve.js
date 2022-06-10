const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("Reserve", function() {
  const totalSupply = 1000000;
  let [admin, seller, buyer, feeRecipient] = [];
  let gold;
  let reserve;
  const address0 = "0x0000000000000000000000000000000000000000";
  const reserveBalance = ethers.utils.parseUnits("1000", "ether");
  const oneWeek = 86400 * 7;
  beforeEach(async function() {
    [admin, seller, buyer, feeRecipient] = await ethers.getSigners();
    const Gold = await ethers.getContractFactory("GoldToken");
    gold = await Gold.deploy(totalSupply);
    await gold.deployed();
    const Reserve = await ethers.getContractFactory("Reserve");
    reserve = await Reserve.deploy(gold.address);
    await reserve.deployed();
  });

  describe("withdrawTo()", function() {
    beforeEach(function() {
      gold.transfer(reserve.address, reserveBalance);
    });
    it("should revert if sender is not owner", async function() {
      const withdrawTx = reserve.connect(seller)
        .withdrawTo(seller.address, reserveBalance);
      await expect(withdrawTx)
        .to
        .be
        .revertedWith("Ownable: caller is not the owner");
    });
    it("should revert if time is not enough", async function() {
      const withdrawTx = reserve.withdrawTo(admin.address, reserveBalance);
      await expect(withdrawTx)
        .to
        .be
        .revertedWith("Reserve: Do not enough time");
    });
    it("should revert if sender is address0", async function() {
      await network.provider.send("evm_increaseTime", [oneWeek * 1]);
      const withdrawTx = reserve.withdrawTo(address0, reserveBalance);
      await expect(withdrawTx)
        .to
        .be
        .revertedWith("Reserve: Receiver must be not address0");
    });
    it("should revert if balance is not enough", async function() {
      await network.provider.send("evm_increaseTime", [oneWeek * 1]);
      await reserve.withdrawTo(admin.address, reserveBalance);
      const withdrawTx = reserve.withdrawTo(admin.address, reserveBalance);
      await expect(withdrawTx)
        .to
        .be
        .revertedWith("Reserve: Do not enough balance");
    });
    it("should withdraw correctly", async function() {
      await network.provider.send("evm_increaseTime", [oneWeek * 1]);
      await reserve.withdrawTo(feeRecipient.address, reserveBalance);
      const adminBalance = await gold.balanceOf(feeRecipient.address);
      expect(adminBalance).to.be.equal(reserveBalance);
    });
  });

  describe("migrate with marketplace", function() {
    it("should withdraw correctly with fee from marketplace", async function() {
      const feeRate = 10;
      const feeDecimal = 0;
      const defaultPrice = ethers.utils.parseUnits("100", "ether");
      await gold.transfer(buyer.address, defaultPrice);

      const Petty = await ethers.getContractFactory("Petty");
      const petty = await Petty.deploy();
      await petty.deployed();
      const Marketplace = await ethers.getContractFactory("Marketplace");
      const marketplace = await Marketplace.deploy(
        petty.address,
        feeRate,
        feeDecimal,
        reserve.address
      );
      await marketplace.deployed();
      await marketplace.addPaymentToken(gold.address);

      await petty.mint(seller.address);
      await petty.connect(seller).approve(marketplace.address, 1);
      await marketplace.connect(seller).addOrder(1, gold.address, defaultPrice);
      await gold.connect(buyer).approve(marketplace.address, defaultPrice);
      await marketplace.connect(buyer).executeOrder(1);

      const fee = defaultPrice.mul(feeRate).div(10 ** (feeDecimal + 2));
      const sellingReceipt = defaultPrice.sub(fee);
      await expect(reserve.connect(admin).withdrawTo(feeRecipient.address, fee))
        .to.be.revertedWith("Reserve: Do not enough time");
      
      expect(await gold.balanceOf(reserve.address)).to.be.equal(fee);
      await network.provider.send("evm_increaseTime", [oneWeek]);
      await reserve.connect(admin).withdrawTo(feeRecipient.address, fee);
      expect(await gold.balanceOf(feeRecipient.address)).to.be.equal(fee);
      expect(await gold.balanceOf(reserve.address)).to.be.equal(0);
    });
  });
});