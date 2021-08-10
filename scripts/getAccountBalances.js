const network = hre.network.name;
const { ethers } = require('ethers');
const fs = require('fs');

const getWallets = require("../utils/getWallets.js");

if(network === "hardhat"){

}
else {
  config = JSON.parse(fs.readFileSync(`./config/${network}.json`).toString().trim());
}

const webSocketProvider = new ethers.providers.WebSocketProvider(config.wss);

const addresses = getWallets(00,150).map(wallet => {
  return wallet.address;
});

const main = async function(){   
    for(let i = 0; i < addresses.length; i++)
    {
      const balance = await webSocketProvider.getBalance(addresses[i]);

      console.log(`Account ${i} with address ${addresses[i]} has balance of ${ethers.utils.formatEther(balance)}`)
    }
  }; 

main()
.then(() => process.exit(0))
.catch(error => {
console.error(error);
process.exit(1);
});