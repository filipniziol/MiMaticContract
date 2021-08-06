const { expect } = require("chai");
const { ethers } = require("hardhat");
const provider = ethers.provider;
const utils = ethers.utils;

let owner;
let usdc;
let miMatic;
let testLendingPool;
let testLendingPoolAddressesProvider;

describe("MiMaticLiquidateCamWMatic", function() {
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

      const MiMaticLiquidateCamWMatic = await ethers.getContractFactory("MiMaticLiquidateCamWMatic");
      const miMaticLiquidateCamWMatic = await MiMaticLiquidateCamWMatic.deploy(
        testQiLiquidator.address,
        testUniswapV2Router02.address, 
        testLendingPoolAddressesProvider.address,
        usdc.address, 
        miMatic.address);
      await miMaticLiquidateCamWMatic.deployed();
  
      expect(await miMaticLiquidateCamWMatic.owner()).to.equal(owner.address);
    });

    it("Should execute the flash loan", async function(){

      const MiMaticLiquidateCamWMatic = await ethers.getContractFactory("MiMaticLiquidateCamWMatic");
      const miMaticLiquidateCamWMatic = await MiMaticLiquidateCamWMatic.deploy(
        testQiLiquidator.address,
        testUniswapV2Router02.address, 
        testLendingPoolAddressesProvider.address,
        usdc.address, 
        miMatic.address);
      await miMaticLiquidateCamWMatic.deployed();

      await miMaticLiquidateCamWMatic.approveAddresses([owner.address]);

      await usdc.transfer(miMaticLiquidateCamWMatic.address, ethers.utils.parseUnits("0.1",6));
      await usdc.transfer(testLendingPool.address, ethers.utils.parseUnits("1.0",6));

      await miMaticLiquidateCamWMatic.executeFlashLoan(
        usdc.address, ethers.utils.parseUnits("0.1",6),
        ethers.utils.defaultAbiCoder.encode(
          ["uint256 liquidatedVault", "uint256 liquidationCost", "uint256 borrowedUsdc", "uint256 timestamp"],
          [ethers.BigNumber.from("0"),ethers.BigNumber.from("0"), ethers.BigNumber.from("0"), ethers.BigNumber.from("0")])
      );
     
      expect(utils.formatUnits(await usdc.balanceOf(testLendingPool.address),6)).to.equal("1.0009");
      expect(utils.formatUnits(await usdc.balanceOf(miMaticLiquidateCamWMatic.address),6)).to.equal("0.0991");
    });

    it("Should rug pull all the tokens", async function() {

      const MiMaticLiquidateCamWMatic = await ethers.getContractFactory("MiMaticLiquidateCamWMatic");
      const miMaticLiquidateCamWMatic = await MiMaticLiquidateCamWMatic.deploy(
        testQiLiquidator.address,
        testUniswapV2Router02.address, 
        testLendingPoolAddressesProvider.address,
        usdc.address, 
        miMatic.address);
      await miMaticLiquidateCamWMatic.deployed();

      //Sent 1 eth and 1 usdc to the contract
      await owner.sendTransaction({
          to: miMaticLiquidateCamWMatic.address,
          value: ethers.utils.parseEther("1.0")
      });

      await usdc.transfer(miMaticLiquidateCamWMatic.address, ethers.utils.parseUnits("1.0",6));
      await miMatic.transfer(miMaticLiquidateCamWMatic.address, ethers.utils.parseUnits("1.0",18));

      expect(utils.formatEther(await provider.getBalance(miMaticLiquidateCamWMatic.address))).to.equal("1.0");
      expect(utils.formatUnits(await usdc.balanceOf(miMaticLiquidateCamWMatic.address),6)).to.equal("1.0");
      expect(utils.formatUnits(await miMatic.balanceOf(miMaticLiquidateCamWMatic.address),18)).to.equal("1.0");

      await miMaticLiquidateCamWMatic.rugPull();

      //After rug pull no eth and no usdc in the contract
      expect(utils.formatEther(await provider.getBalance(miMaticLiquidateCamWMatic.address))).to.equal("0.0");
      expect(utils.formatUnits(await usdc.balanceOf(miMaticLiquidateCamWMatic.address),6)).to.equal("0.0");
      expect(utils.formatUnits(await miMatic.balanceOf(miMaticLiquidateCamWMatic.address),18)).to.equal("0.0");

      expect(parseFloat(utils.formatEther(await provider.getBalance(owner.address)))).to.be.above(9999.0);
    });
  });