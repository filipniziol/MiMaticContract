const fs = require('fs');

const getWallets = require("../utils/getWallets.js");

const approveAddressesAaveLiquidator = async function(network, addressnumber, secretfilename){
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

  const aaveLiquidatorContractAbi = JSON.stringify(
        JSON.parse(fs.readFileSync(`./artifacts/contracts/AaveLiquidator.sol/AaveLiquidator.json`).toString().trim()).abi
      );
  
  const aaveLiquidatorContract = new ethers.Contract(config.addresses.AaveLiquidator,aaveLiquidatorContractAbi,wallet);
  
  const tx = await aaveLiquidatorContract.approveAddresses(addresses, {gasPrice: ethers.utils.parseUnits('30', 'gwei'), gasLimit: 5000000});
  
  const txResult = await tx.wait(1); 
 
  console.log(txResult.transactionHash);
}

module.exports = approveAddressesAaveLiquidator;