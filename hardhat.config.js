require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');

const approveAddresses = require("./tasks/approveAddresses");
const approveAddressesAaveLiquidator = require("./tasks/approveAddressesAaveLiquidator");
const deploy = require("./tasks/deploy");
const rugPull = require("./tasks/rugPull");
const liquidateVault = require("./tasks/liquidateVault");
const deployIronFinanceProcessor = require("./tasks/deployIronFinanceProcessor");
const deployAaveUserData = require("./tasks/deployAaveUserData");
const deployAaveLiquidator = require("./tasks/deployAaveLiquidator");

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    goerli: {
      url: "https://rpc.goerli.mudit.blog",
      chainId: 5,
      accounts: {
        mnemonic: mnemonic
      }
    },
    kovan: {
      url: "https://kovan.infura.io/v3/254de3ad404a423db4d6bd137b304b79",
      chainId: 42,
      accounts: {
        mnemonic: mnemonic
      }
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/254de3ad404a423db4d6bd137b304b79",
      chainId: 3,
      accounts: {
        mnemonic: mnemonic
      }
    },
    mumbai: {
      url: "https://polygon-mumbai.infura.io/v3/254de3ad404a423db4d6bd137b304b79",
      chainId: 80001,
      accounts: {
        mnemonic: mnemonic
      }
    },    
    polygon: {
      url: "https://polygon-mainnet.infura.io/v3/254de3ad404a423db4d6bd137b304b79",
      chainId: 137,
      accounts: {
        mnemonic: mnemonic
      }
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {},
      },
    ]
  },
};

task("approveAddresses", "Approves addresses for a given liquidator contract")
  .addParam("liquidator", "The name of liquidator contract in config file")
  .addParam("addressnumber", "Number of addresses to approve")
  .addParam("secretfilename", "Name of the file with mnemonic for the approved accounts")
  .setAction(async (taskArgs, hre) => {
    await approveAddresses(hre.network.name, taskArgs.liquidator, taskArgs.addressnumber, taskArgs.secretfilename)
  });

task("approveAddressesAaveLiquidator", "Approves addresses for a given aave liquidator contract")
  .addParam("addressnumber", "Number of addresses to approve")
  .addParam("secretfilename", "Name of the file with mnemonic for the approved accounts")
  .setAction(async (taskArgs, hre) => {
    await approveAddressesAaveLiquidator(hre.network.name, taskArgs.addressnumber, taskArgs.secretfilename)
});

task("deployIronFinanceProcessor", "Deploy a given iron finance processor contract")
  .setAction(async (taskArgs, hre) => {
    await deployIronFinanceProcessor()
  });

task("deployAaveUserData", "Deploy a given aave user data contract")
  .setAction(async (taskArgs, hre) => {
    await deployAaveUserData()
  });

task("deployAaveLiquidator", "Deploy a given aave liquidator contract")
  .setAction(async (taskArgs, hre) => {
    await deployAaveLiquidator()
  });

task("deploy", "Deploy a given liquidator contract")
  .addParam("liquidator", "The name of liquidator contract in config file")
  .setAction(async (taskArgs, hre) => {
    await deploy(hre.network.name, taskArgs.liquidator)
  });

task("rugPull", "Rug pull from a given liquidator contract")
  .addParam("liquidator", "The name of liquidator contract in config file")
  .setAction(async (taskArgs, hre) => {
    await rugPull(hre.network.name, taskArgs.liquidator)
  });

task("liquidateVault", "Liquidate vault in a given liquidator contract")
  .addParam("liquidator", "The name of liquidator contract in config file")
  .addParam("vault", "The liquidated vault")
  .setAction(async (taskArgs, hre) => {
    await liquidateVault(hre.network.name, taskArgs.liquidator, taskArgs.vault)
  });