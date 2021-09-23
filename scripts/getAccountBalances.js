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

const addresses = getWallets(0,153,".secret").map(wallet => {
  return wallet.address;
});

const alibabaAddresses = getWallets(0,150,"alibaba.secret").map(wallet => {
  return wallet.address;
});


const main = async function(){  
    let totalBalance = ethers.BigNumber.from("0");

    for(let i = 0; i < addresses.length; i++)
    {
      const balance = await webSocketProvider.getBalance(addresses[i]);
      totalBalance = totalBalance.add(balance);

      console.log(`Account ${i} with address ${addresses[i]} has balance of ${ethers.utils.formatEther(balance)}`)
    }

    for(let i = 0; i < alibabaAddresses.length; i++)
    {
      const balance = await webSocketProvider.getBalance(alibabaAddresses[i]);
      totalBalance = totalBalance.add(balance);

      console.log(`Alibaba Account ${i} with address ${alibabaAddresses[i]} has balance of ${ethers.utils.formatEther(balance)}`)
    }

    console.log(`Total Balance ${ethers.utils.formatEther(totalBalance)}`)
  }; 

main()
.then(() => process.exit(0))
.catch(error => {
console.error(error);
process.exit(1);
});