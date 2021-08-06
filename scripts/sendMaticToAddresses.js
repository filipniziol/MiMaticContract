const network = hre.network.name;
const { ethers } = require('ethers');
const fs = require('fs');

const getWallets = require("./../utils/getWallets.js");
const { NonceManager } = require("@ethersproject/experimental");

if(network === "hardhat"){

}
else {
  config = JSON.parse(fs.readFileSync(`./config/${network}.json`).toString().trim());
}

const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpc);

const webSocketProvider = new ethers.providers.WebSocketProvider(config.wss);

const mnemonic = fs.readFileSync(".secret").toString().trim();

let wallet = ethers.Wallet.fromMnemonic(mnemonic);

wallet = wallet.connect(rpcProvider);

wallet = new NonceManager(wallet);

const addresses = getWallets(40,10).map(wallet => {
  return wallet.address;
});

async function delay(ms) {
  // return await for better async stack trace support in case of errors.
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async function(){   
    for(let i = 0; i < addresses.length; i++)
    {
      await delay(1000); 

      const balance = await webSocketProvider.getBalance(addresses[i]);

      console.log(`Account ${addresses[i]} has balance of ${ethers.utils.formatEther(balance)}`)

      if (balance.isZero()){

          console.log("Sending matic to ",  addresses[i]);

          const tx = await wallet.sendTransaction({
            to: addresses[i],
            value: ethers.utils.parseEther("5.0"),
            gasPrice: ethers.utils.parseUnits("75.0", "gwei")
          });

          const txResult = await tx.wait(1);
          console.log(txResult.transactionHash);

          console.log("5 MATIC has been sent to ", addresses[i]);
      }
    }
}; 

main()
.then(() => process.exit(0))
.catch(error => {
console.error(error);
process.exit(1);
});