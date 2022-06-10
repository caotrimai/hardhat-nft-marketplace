const { expect } = require("chai");
const { ethers } = require("hardhat");

const MESSAGE = {
  ONLY_OWNER: "Ownable: caller is not the owner"
};
describe("Marketplace", function() {
  let [admin, seller, buyer, feeRecipient, samplePaymentToken] = [];
  const address0 = "0x0000000000000000000000000000000000000000";
  const defaultPrice = ethers.utils.parseUnits("100", "ether");
  const defaultBalance = ethers.utils.parseUnits("1000", "ether");
  const defaultFeeRate = 10;
  const defaultFeeDecimal = 0;
  const totalSupply = 1000000;
  let marketplace;
  let gold;
  let petty;
  beforeEach(async function() {
    [
      admin,
      seller,
      buyer,
      feeRecipient,
      samplePaymentToken] = await ethers.getSigners();
    const Gold = await ethers.getContractFactory("GoldToken");
    gold = await Gold.deploy(totalSupply);
    await gold.deployed();
    const Petty = await ethers.getContractFactory("Petty");
    petty = await Petty.deploy();
    await petty.deployed();
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(petty.address, defaultFeeRate,
      defaultFeeDecimal, feeRecipient.address);
    await marketplace.deployed();
    await marketplace.addPaymentToken(gold.address);
    await gold.transfer(seller.address, defaultBalance);
    await gold.transfer(buyer.address, defaultBalance);
  });

  describe("common", function() {
    it("feeRecipient should return correct value", async function() {
      expect(await marketplace.feeRecipient())
        .to
        .be
        .equal(feeRecipient.address);
    });
    it(`should has feeRate is ${defaultFeeRate}`, async function() {
      expect(await marketplace.feeRate()).to.be.equal(defaultFeeRate);
    });
    it(`should has feeDecimal is ${defaultFeeDecimal}`, async function() {
      expect(await marketplace.feeDecimal()).to.be.equal(defaultFeeDecimal);
    });
  });

  describe("updateFeeRecipient()", function() {
    it("should revert if not owner role", async function() {
      await expect(
        marketplace.connect(seller).updateFeeRecipient(seller.address))
        .to
        .be
        .revertedWith(MESSAGE.ONLY_OWNER);
    });
    it("should revert if address0", async function() {
      await expect(
        marketplace.updateFeeRecipient(address0))
        .to
        .be
        .revertedWith("NFTMarketplace: can not update to address0");
    });
    it("should revert if not owner role", async function() {
      await marketplace.updateFeeRecipient(seller.address);
      expect(await marketplace.feeRecipient()).to.be.equal(seller.address);
    });
  });

  describe("updateFee()", function() {
    const [newRateFee, newDecimalFee] = [20, 1]; //2%
    it("show revert if not owner role", async function() {
      const updateFeeTx = marketplace.connect(seller)
        .updateFee(newRateFee, newDecimalFee);
      await expect(updateFeeTx).to.be.revertedWith(MESSAGE.ONLY_OWNER);
    });
    it("show revert if feeRate >= 5 *10^(feeDecimal + 1) (fee>50%)",
      async function() {
        const [newRateFee, newDecimalFee] = [50, 0]; //100%
        const updateFeeTx = marketplace.updateFee(newRateFee, newDecimalFee);
        await expect(updateFeeTx)
          .to
          .be
          .revertedWith("NFTMarketplace: bad fee rate");
      });
    it("should update fee correctly", async function() {
      const updateFeeTx = await marketplace.updateFee(newRateFee,
        newDecimalFee);
      expect(updateFeeTx)
        .to
        .emit(marketplace, "FeeUpdated")
        .withArgs(newRateFee, newDecimalFee);
    });
  });

  describe("addPaymentToken()", function() {
    it("should revert if not owner role", async function() {
      const addPaymentTx = marketplace.connect(seller)
        .addPaymentToken(samplePaymentToken.address);
      await expect(addPaymentTx).to.be.revertedWith(MESSAGE.ONLY_OWNER);
    });
    it("should revert if payment token is address0", async function() {
      const addPaymentTx = marketplace.addPaymentToken(address0);
      await expect(addPaymentTx)
        .to
        .be
        .revertedWith("NFTMarketplace: _paymentToken is zero address");
    });
    it("should revert if payment token is already supported", async function() {
      await marketplace.addPaymentToken(samplePaymentToken.address);
      const addPaymentTx = marketplace.addPaymentToken(
        samplePaymentToken.address);
      await expect(addPaymentTx)
        .to
        .be
        .revertedWith("NFTMarketplace: already supported");
    });
    it("should add payment token correctly", async function() {
      await marketplace.addPaymentToken(samplePaymentToken.address);
      expect(
        await marketplace.isPaymentTokenSupported(samplePaymentToken.address))
        .to
        .be
        .equal(true);
    });
  });

  describe("addOrder()", function() {
    beforeEach(async function() {
      await petty.mint(seller.address);
    });
    it("should revert if not support payment token", async function() {
      await petty.connect(seller).approve(marketplace.address, 1);
      const addTx = marketplace.connect(seller)
        .addOrder(1, samplePaymentToken.address, defaultPrice);
      await expect(addTx)
        .to
        .be
        .revertedWith("NFTMarketplace: payment token is not supported");
    });
    it("should revert if price = 0", async function() {
      await petty.connect(seller).approve(marketplace.address, 1);
      const addTx = marketplace.connect(seller).addOrder(1, gold.address, 0);
      await expect(addTx)
        .to
        .be
        .revertedWith("NFTMarketplace: Price must be greater than 0");
    });
    it("should revert if sender is not owner of token", async function() {
      await petty.connect(seller).approve(marketplace.address, 1);
      const addTx = marketplace.connect(buyer)
        .addOrder(1, gold.address, defaultPrice);
      await expect(addTx)
        .to
        .be
        .revertedWith("NFTMarketplace: Sender are not owner of the token");
    });
    it("should revert if owner did not approve to marketplace",
      async function() {
        const addTx = marketplace.connect(seller)
          .addOrder(1, gold.address, defaultPrice);
        await expect(addTx).to.be.revertedWith(
          "NFTMarketplace: The contract is unauthorized to manage this token");
      });
    it("should add order correctly", async function() {
      await petty.connect(seller).approve(marketplace.address, 1);
      const addTx = marketplace.connect(seller)
        .addOrder(1, gold.address, defaultPrice);
      await expect(addTx)
        .to
        .emit(marketplace, "OrderAdded")
        .withArgs(1, seller.address, 1, gold.address, defaultPrice);
      expect(await petty.ownerOf(1)).to.be.equal(marketplace.address);
      expect(await petty.balanceOf(seller.address)).to.be.equal(0);

      await petty.connect(admin).mint(seller.address);
      await petty.connect(seller).approve(marketplace.address, 2);
      const addTx2 = marketplace.connect(seller)
        .addOrder(2, gold.address, defaultPrice);
      await expect(addTx2)
        .to
        .emit(marketplace, "OrderAdded")
        .withArgs(2, seller.address, 2, gold.address, defaultPrice);
      expect(await petty.ownerOf(2)).to.be.equal(marketplace.address);
      expect(await petty.balanceOf(seller.address)).to.be.equal(0);
    });
  });

  describe("cancelOrder()", function() {
    beforeEach(async function() {
      await petty.mint(seller.address);
      await petty.connect(seller).approve(marketplace.address, 1);
      await marketplace.connect(seller).addOrder(1, gold.address, defaultPrice);
    });
    it("should revert if sender is not owner", async function() {
      const cancelTx = marketplace.connect(buyer).cancelOrder(1);
      await expect(cancelTx).to.be.revertedWith("NFTMarket: Must be owner");
    });
    it("should revert if order has been sold", async function() {
      await gold.connect(buyer).approve(marketplace.address, defaultPrice);
      await marketplace.connect(buyer).executeOrder(1);
      const cancelTx = marketplace.connect(seller).cancelOrder(1);
      await expect(cancelTx).to.be.revertedWith("NFTMarket: Order was bought");
    });
    it("should cancel order correctly", async function() {
      const cancelTx = await marketplace.connect(seller).cancelOrder(1);
      await expect(cancelTx).to.emit(marketplace, "OrderCanceled").withArgs(1);
      expect(await petty.ownerOf(1)).to.be.equal(seller.address);
      expect(await petty.balanceOf(seller.address)).to.be.equal(1);
      expect(await petty.balanceOf(marketplace.address)).to.be.equal(0);
    });
  });
  
  describe("executeOrder()", function() {
    beforeEach(async function() {
      await petty.mint(seller.address);
      await petty.connect(seller).approve(marketplace.address, 1);
      await marketplace.connect(seller).addOrder(1, gold.address, defaultPrice);
      await gold.connect(buyer).approve(marketplace.address, defaultPrice);
    });
    it("should revert if order was canceled", async function() {
      await marketplace.connect(seller).cancelOrder(1);
      const buyTx = marketplace.connect(buyer).executeOrder(1);
      await expect(buyTx).to.be.revertedWith("NFTMarketplace: This order was canceled");
    });
    it("should revert if sender is seller", async function() {
      const buyTx = marketplace.connect(seller).executeOrder(1);
      await expect(buyTx).to.be.revertedWith("NFTMarketplace: Sender must not buyer");
    });
    it("should revert if order was sold", async function() {
      await marketplace.connect(buyer).executeOrder(1);
      await gold.connect(buyer).approve(marketplace.address, defaultPrice);
      const buyTx = marketplace.connect(buyer).executeOrder(1);
      await expect(buyTx).to.be.revertedWith("NFTMarketplace: This order was sold");
    });
    it("should revert if token balance of sender is not enough", async function() {
      await gold.connect(buyer).transfer(seller.address, defaultBalance);
      const buyTx = marketplace.connect(buyer).executeOrder(1);
      await expect(buyTx).to.be.revertedWith("NFTMarketplace: Not enough tokens");
    });
    it("should revert if sender did not approve tokens", async function() {
      await gold.connect(buyer).approve(marketplace.address, 0);
      const buyTx = marketplace.connect(buyer).executeOrder(1);
      await expect(buyTx).to.be.revertedWith("NFTMarketplace: Not approve enough tokens");
    });
    it("should buy correctly with default fee", async function() {
      // buy token 1
      const buyTx = marketplace.connect(buyer).executeOrder(1);
      await expect(buyTx).to.emit(marketplace, "OrderMatched")
        .withArgs(1, seller.address, buyer.address, 1, gold.address, defaultPrice);
      expect(await petty.ownerOf(1)).to.be.equal(buyer.address);
      expect(await petty.balanceOf(buyer.address)).to.be.equal(1);

      // sell token 2
      await petty.mint(seller.address);
      await petty.connect(seller).approve(marketplace.address, 2);
      await marketplace.connect(seller).addOrder(2, gold.address, defaultPrice);

      // // buy token 2
      await gold.connect(buyer).approve(marketplace.address, defaultPrice);
      const buyTx2 = marketplace.connect(buyer).executeOrder(2);
      await expect(buyTx2).to.emit(marketplace, "OrderMatched")
        .withArgs(2, seller.address, buyer.address, 2, gold.address, defaultPrice);
      expect(await petty.ownerOf(2)).to.be.equal(buyer.address);
      expect(await petty.balanceOf(buyer.address)).to.be.equal(2);
    });
    it("should buy correctly with fee = 0",async function() {
      await marketplace.updateFee(0, 0);
      const buyTx = marketplace.connect(buyer).executeOrder(1);
      await expect(buyTx).to.emit(marketplace, "OrderMatched")
        .withArgs(1, seller.address, buyer.address, 1, gold.address, defaultPrice);
      expect(await petty.ownerOf(1)).to.be.equal(buyer.address);
      expect(await petty.balanceOf(buyer.address)).to.be.equal(1);
    });
    it("should buy correctly with fee = 49%",async function() {
      await marketplace.updateFee(49, 0);
      const buyTx = marketplace.connect(buyer).executeOrder(1);
      await expect(buyTx).to.emit(marketplace, "OrderMatched")
        .withArgs(1, seller.address, buyer.address, 1, gold.address, defaultPrice);
      expect(await petty.ownerOf(1)).to.be.equal(buyer.address);
      expect(await petty.balanceOf(buyer.address)).to.be.equal(1);
    });
    it("should buy correctly with fee = 10.11111%",async function() {
      await marketplace.updateFee(1011111, 5);
      const buyTx = marketplace.connect(buyer).executeOrder(1);
      await expect(buyTx).to.emit(marketplace, "OrderMatched")
        .withArgs(1, seller.address, buyer.address, 1, gold.address, defaultPrice);
      expect(await petty.ownerOf(1)).to.be.equal(buyer.address);
      expect(await petty.balanceOf(buyer.address)).to.be.equal(1);
    });
  });
});