const fs = require('fs');

const getWallets = require("../utils/getWallets.js");

const approveAddresses = async function(network, liquidator, addressnumber, secretfilename){
  if(network === "hardhat"){

  }
  else {
    config = JSON.parse(fs.readFileSync(`./config/${network}.json`).toString().trim());
  }
  
  const provider = new ethers.providers.JsonRpcProvider(config.rpc);
  
  const mnemonic = fs.readFileSync(".secret").toString().trim();
  
  let wallet = ethers.Wallet.fromMnemonic(mnemonic);
  
  wallet = wallet.connect(provider);

  const addresses = getWallets(0,parseInt(addressnumber),secretfilename).map(wallet => {
    return wallet.address;
  });

  const miMaticLiquidateContractAbi = JSON.stringify(
        JSON.parse(fs.readFileSync(`./artifacts/contracts/${liquidator}.sol/${liquidator}.json`).toString().trim()).abi
      );
  
  const miMaticLiquidateContract = new ethers.Contract(config.liquidators[liquidator].deployedContract,miMaticLiquidateContractAbi,wallet);
  
  const tx = await miMaticLiquidateContract.approveAddresses(addresses, {gasPrice: ethers.utils.parseUnits('30', 'gwei'), gasLimit: 5000000});
  
  const txResult = await tx.wait(1);
  
  console.log(txResult.transactionHash);
  console.log("All the addresses have been approved", config.liquidators[liquidator].deployedContract);
}

module.exports = approveAddresses;