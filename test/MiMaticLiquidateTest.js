const { expect } = require("chai");
const { ethers } = require("hardhat");
const provider = ethers.provider;
const utils = ethers.utils;

let owner;
let usdc;
let miMatic;
let testLendingPool;
let testLendingPoolAddressesProvider;

describe("MiMaticLiquidate", function() {
    before(async function(){
      [owner] = await ethers.getSigners();

      const TestERC20       = await ethers.getContractFactory("TestERC20");
      const TestLendingPool = await ethers.getContractFactory("TestLendingPool");
      const TestLendingPoolAddressesProvider = await ethers.getContractFactory("TestLendingPoolAddressesProvider");
      const TestQiLiquidator = await ethers.getContractFactory("TestQiLiquidator");
      const TestUniswapV2Router02 = await ethers.getContractFactory("TestUniswapV2Router02");

      usdc = await TestERC20.deploy(
        "USD Coin",
        "USDC",
        6
      );

      miMatic = await TestERC20.deploy(
        "miMATIC",
        "miMATIC",
        18
      );

      testLendingPool = await TestLendingPool.deploy();

      testUniswapV2Router02 = await TestUniswapV2Router02.deploy();

      testQiLiquidator = await TestQiLiquidator.deploy();

      testLendingPoolAddressesProvider = await TestLendingPoolAddressesProvider.deploy(testLendingPool.address);
    });

    it("Should have the deployer address as the owner", async function() {      

      const MiMaticLiquidate = await ethers.getContractFactory("MiMaticLiquidate");
      const miMaticLiquidate = await MiMaticLiquidate.deploy(
        testQiLiquidator.address,
        testUniswapV2Router02.address, 
        testLendingPoolAddressesProvider.address,
        usdc.address, 
        miMatic.address);
      await miMaticLiquidate.deployed();
  
      expect(await miMaticLiquidate.owner()).to.equal(owner.address);
    });

    it("Should execute the flash loan", async function(){

      const MiMaticLiquidate = await ethers.getContractFactory("MiMaticLiquidate");
      const miMaticLiquidate = await MiMaticLiquidate.deploy(
        testQiLiquidator.address,
        testUniswapV2Router02.address, 
        testLendingPoolAddressesProvider.address,
        usdc.address, 
        miMatic.address);
      await miMaticLiquidate.deployed();

      await miMaticLiquidate.approveAddresses([owner.address]);

      await usdc.transfer(miMaticLiquidate.address, ethers.utils.parseUnits("0.1",6));
      await usdc.transfer(testLendingPool.address, ethers.utils.parseUnits("1.0",6));

      await miMaticLiquidate.executeFlashLoan(usdc.address, ethers.utils.parseUnits("0.1",6));
     
      expect(utils.formatUnits(await usdc.balanceOf(testLendingPool.address),6)).to.equal("1.0009");
      expect(utils.formatUnits(await usdc.balanceOf(miMaticLiquidate.address),6)).to.equal("0.0991");
    });

    it("Should rug pull all the tokens", async function() {

      const MiMaticLiquidate = await ethers.getContractFactory("MiMaticLiquidate");
      const miMaticLiquidate = await MiMaticLiquidate.deploy(
        testQiLiquidator.address,
        testUniswapV2Router02.address, 
        testLendingPoolAddressesProvider.address,
        usdc.address, 
        miMatic.address);
      await miMaticLiquidate.deployed();

      //Sent 1 eth and 1 usdc to the contract
      await owner.sendTransaction({
          to: miMaticLiquidate.address,
          value: ethers.utils.parseEther("1.0")
      });

      await usdc.transfer(miMaticLiquidate.address, ethers.utils.parseUnits("1.0",6));
      await miMatic.transfer(miMaticLiquidate.address, ethers.utils.parseUnits("1.0",18));

      expect(utils.formatEther(await provider.getBalance(miMaticLiquidate.address))).to.equal("1.0");
      expect(utils.formatUnits(await usdc.balanceOf(miMaticLiquidate.address),6)).to.equal("1.0");
      expect(utils.formatUnits(await miMatic.balanceOf(miMaticLiquidate.address),18)).to.equal("1.0");

      await miMaticLiquidate.rugPull();

      //After rug pull no eth and no usdc in the contract
      expect(utils.formatEther(await provider.getBalance(miMaticLiquidate.address))).to.equal("0.0");
      expect(utils.formatUnits(await usdc.balanceOf(miMaticLiquidate.address),6)).to.equal("0.0");
      expect(utils.formatUnits(await miMatic.balanceOf(miMaticLiquidate.address),18)).to.equal("0.0");

      expect(parseFloat(utils.formatEther(await provider.getBalance(owner.address)))).to.be.above(9999.0);
    });
  });