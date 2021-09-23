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

const ironFinanceProcessorAbi = JSON.stringify(JSON.parse(fs.readFileSync("./artifacts/contracts/IronFinanceProcessor.sol/IronFinanceProcessor.json").toString().trim()).abi);

const ironFinanceProcessorContract = new ethers.Contract(config.addresses.IronFinanceProcessor,ironFinanceProcessorAbi,wallet);

const main = async function(){    
    const tx = await ironFinanceProcessorContract.process(
      ethers.utils.parseUnits("3200000",6),
      ethers.utils.parseUnits("3200000",6),
      {gasPrice: ethers.utils.parseUnits('10', 'gwei'), gasLimit: 6000000});

    console.log("The flash loan has been executed.");
}

main();