const fs = require('fs');

async function deploy(network, liquidator) {
    // We get the contract to deploy
    const [owner] = await ethers.getSigners();

    let config = {
      "addresses":{},
      "liquidators":{
      }
    };

    config.liquidators[liquidator] = {};

    if(network === "hardhat"){
      const TestERC20       = await ethers.getContractFactory("TestERC20");
      const TestLendingPool = await ethers.getContractFactory("TestLendingPool");
      const TestLendingPoolAddressesProvider = await ethers.getContractFactory("TestLendingPoolAddressesProvider");
      const TestQiLiquidator = await ethers.getContractFactory("TestQiLiquidator");
      const TestUniswapV2Router02 = await ethers.getContractFactory("TestUniswapV2Router02");

      const usdc = await TestERC20.deploy(
        "USD Coin",
        "USDC",
        6
      );

      const miMatic = await TestERC20.deploy(
        "miMATIC",
        "miMATIC",
        18
      );

      const testLendingPool = await TestLendingPool.deploy();

      const testUniswapV2Router02 = await TestUniswapV2Router02.deploy();

      const testQiLiquidator = await TestQiLiquidator.deploy();

      const testLendingPoolAddressesProvider = await TestLendingPoolAddressesProvider.deploy(testLendingPool.address);

      config.liquidators[liquidator].qiLiquidator = testQiLiquidator.address;
      config.addresses.quickSwapRouter = testUniswapV2Router02.address;
      config.addresses.aaveLendingPoolAddressProvider = testLendingPoolAddressesProvider.address;
      config.addresses.usdc = usdc.address;
      config.addresses.miMatic = miMatic.address;

      console.log("Test QiLiquidator deployed to: ", testQiLiquidator.address);
      console.log("Test QuickSwapRouter deployed to: ", testUniswapV2Router02.address);
      console.log("Test AaveLendingPoolAddressProvider deployed to: ", testLendingPoolAddressesProvider.address);
      console.log("Test USDC deployed to: ", usdc.address);
      console.log("Test miMATIC deployed to: ", miMatic.address);
    }
    else {
      config = JSON.parse(fs.readFileSync(`./config/${network}.json`).toString().trim());
    }
    console.log("MiMaticLiquidate deployed by:", owner.address);

    const MiMaticLiquidate = await ethers.getContractFactory(liquidator);
    let miMaticLiquidate;

    if(["MiMaticLiquidate","MiMaticLiquidateCamWMatic"].includes(liquidator)){
      miMaticLiquidate = await MiMaticLiquidate.deploy(
        config.liquidators[liquidator].qiLiquidator,
        config.addresses.quickSwapRouter,
        config.addresses.aaveLendingPoolAddressProvider,
        config.addresses.usdc,
        config.addresses.miMatic
        ,{gasPrice: ethers.utils.parseUnits('10', 'gwei')}
      );
    }
    else if(["MiMaticLiquidateToken","MiMaticLiquidateCamToken"].includes(liquidator)){
      miMaticLiquidate = await MiMaticLiquidate.deploy(
        config.addresses.quickSwapRouter,
        config.addresses.aaveLendingPoolAddressProvider,
        config.addresses.usdc,
        config.addresses.miMatic     
        ,{gasPrice: ethers.utils.parseUnits('10', 'gwei')}
      ); 
    }

    console.log("MiMaticLiquidate deployed to:", miMaticLiquidate.address);

    if(network !== "hardhat"){
      if(["CamWMATIC"].includes(config.liquidators[liquidator].type)){
        let tx = await miMaticLiquidate.setCamToken(config.liquidators[liquidator].camToken,{gasPrice: ethers.utils.parseUnits('10', 'gwei'), gasLimit: 200000});
        let txResult = await tx.wait(1);
  
        console.log(txResult.transactionHash);
  
        console.log("The setCamToken has been executed.");

        tx = await miMaticLiquidate.setAaveWETHGateway(config.addresses.aaveWETHGateway,{gasPrice: ethers.utils.parseUnits('10', 'gwei'), gasLimit: 200000});
        txResult = await tx.wait(1);
  
        console.log(txResult.transactionHash);
  
        console.log("The setAaveWETHGateway has been executed.");
      }
    }
  }
  
module.exports = deploy;