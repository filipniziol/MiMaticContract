const fs = require('fs');

const rugPull = async function(network, liquidator){
  if(network === "hardhat"){

  }
  else {
    config = JSON.parse(fs.readFileSync(`./config/${network}.json`).toString().trim());
  }
  
  const provider = new ethers.providers.JsonRpcProvider(config.rpc);
  
  const mnemonic = fs.readFileSync(".secret").toString().trim();
  
  let wallet = ethers.Wallet.fromMnemonic(mnemonic);
  
  wallet = wallet.connect(provider);
  
  const miMaticLiquidateContractAbi = JSON.stringify(JSON.parse(fs.readFileSync(`./artifacts/contracts/${liquidator}.sol/${liquidator}.json`).toString().trim()).abi);
  
  const miMaticLiquidateContract = new ethers.Contract(config.liquidators[liquidator].deployedContract,miMaticLiquidateContractAbi,wallet);

  const tx = await miMaticLiquidateContract.rugPull( {gasPrice: ethers.utils.parseUnits('10', 'gwei'), gasLimit: 100000});

  const txResult = await tx.wait(1);
  console.log(txResult.transactionHash);
  console.log("All the tokens have been withdrawn from", config.liquidators[liquidator].deployedContract);
  
}

module.exports = rugPull;