const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Petty", function () {
  let [accountA, accountB, accountC] = [];
  let nft;
  const uri = 'testURI';
  const address0 = "0x0000000000000000000000000000000000000000";
  beforeEach(async function () {
    [accountA, accountB, accountC] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Petty");
    nft = await Token.deploy();
    await nft.deployed();
  });
  describe("mint()", function(){
    it("should revert if mint to zero address", async function () {
      await expect(nft.mint(address0)).to.be.revertedWith("ERC721: mint to the zero address")
    });
    it("should be revert when sender is not owner", async function() {
      await expect(nft.connect(accountB).mint(accountB.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("should be mint new NFT correctly", async function() {
      const mintTx = await nft.mint(accountA.address);
      expect(mintTx).to.be.emit(nft,"Transfer").withArgs(address0, accountA.address, 1);
      expect(await nft.ownerOf(1)).to.be.equal(accountA.address);
      expect(await nft.balanceOf(accountA.address)).to.be.equal(1);

      const mintBTx = await nft.mint(accountB.address);
      expect(mintBTx).to.be.emit(nft,"Transfer").withArgs(address0, accountB.address, 2);
      expect(await nft.ownerOf(2)).to.be.equal(accountB.address);
      expect(await nft.balanceOf(accountB.address)).to.be.equal(1);
    });
  });
  describe("updateBaseTokenURI()", function(){
    it("should be revert when sender is not owner", async function() {
      await expect(nft.connect(accountB).updateBaseTokenURI(uri)).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("should be update base token URI correctly",async function(){
      await nft.updateBaseTokenURI(uri);
      await nft.mint(accountA.address);
      expect(await nft.tokenURI(1)).to.be.equal(`${uri}1`);
    });
  });
});