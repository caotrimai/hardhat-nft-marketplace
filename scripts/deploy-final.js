// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");

async function main () {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let gold;
  let petty;
  let marketplace;
  let reserve;
  const defaultFeeRate = 0;
  const defaultFeeDecimal = 0;
  // deploy Gold
  const Gold = await ethers.getContractFactory("GoldToken");
  gold = await Gold.deploy(10000000);
  await gold.deployed();
  console.log("Gold deployed to ", gold.address);

  // deploy Petty
  const Petty = await ethers.getContractFactory("Petty");
  petty = await Petty.deploy();
  await petty.deployed();
  console.log("Petty deployed to ", petty.address);

  // deploy Reserve
  const Reserve = await ethers.getContractFactory("Reserve");
  reserve = await Reserve.deploy(gold.address);
  await reserve.deployed();
  console.log("Reserve deployed to ", reserve.address);

  // deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  marketplace = await Marketplace.deploy(petty.address, defaultFeeRate,
    defaultFeeDecimal, reserve.address);
  await marketplace.deployed();
  console.log("Marketplace deployed to ", marketplace.address);

  const addPaymentTokenTx = await marketplace.addPaymentToken(gold.address);
  await addPaymentTokenTx.wait();

  console.log("Gold is payment token true or false: ",
    await marketplace.isPaymentTokenSupported(gold.address));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
