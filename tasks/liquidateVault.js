const fs = require('fs');

const ethers = require("ethers");

const liquidateVault = async function(network, liquidator, vault){
  if(network === "hardhat"){

  }
  else {
    config = JSON.parse(fs.readFileSync(`./config/${network}.json`).toString().trim());
  }
  
  const provider = new ethers.providers.JsonRpcProvider(config.rpc);
  
  const mnemonic = fs.readFileSync(".secret").toString().trim();
  
  let wallet = ethers.Wallet.fromMnemonic(mnemonic);
  
  wallet = wallet.connect(provider);
  
  const miMaticLiquidateContractAbi = JSON.stringify(
      JSON.parse(fs.readFileSync(`./artifacts/contracts/${liquidator}.sol/${liquidator}.json`).toString().trim()).abi
    );
  
  const miMaticLiquidateContract = new ethers.Contract(config.liquidators[liquidator].deployedContract,miMaticLiquidateContractAbi,wallet);

  const tx = await miMaticLiquidateContract.liquidateVault(
    vault, 
    Math.floor(Date.now() / 1000),
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    "0x11A33631a5B5349AF3F165d2B7901A4d67e561ad",
    "0x28424507fefb6f7f8E9D3860F56504E4e5f5f390",
    "0x0470CD31C8FcC42671465880BA81D631F0B76C1D",
    {gasPrice: ethers.utils.parseUnits('10', 'gwei'), gasLimit: 2000000});

  const txResult = await tx.wait(1);

  console.log(txResult.transactionHash);

  console.log("The liquidateVault has been executed.");
}

module.exports = liquidateVault;