const network = hre.network.name;
const fs = require('fs');
const utils = ethers.utils;

if(network === "hardhat"){

}
else {
  config = JSON.parse(fs.readFileSync(`./config/${network}.json`).toString().trim());
}

const provider = new ethers.providers.JsonRpcProvider(config.rpc);

const mnemonic = fs.readFileSync(".secret").toString().trim();

let wallet = ethers.Wallet.fromMnemonic(mnemonic);

wallet = wallet.connect(provider);

const miMaticLiquidateContractAbi = JSON.stringify(JSON.parse(fs.readFileSync("./artifacts/contracts/MiMaticLiquidate.sol/MiMaticLiquidate.json").toString().trim()).abi);

const miMaticLiquidateContract = new ethers.Contract(config.addresses.miMaticLiquidate,miMaticLiquidateContractAbi,wallet);

const main = async function(){    
    const tx = await miMaticLiquidateContract.executeFlashLoan(config.addresses.wMatic, ethers.utils.parseUnits("0.001",18) ,{gasLimit: 500000});

    console.log("The flash loan has been executed.");
}

await main();