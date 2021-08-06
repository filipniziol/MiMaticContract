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

    const [owner] = await ethers.getSigners();
    const tx = await miMaticLiquidateContract.executeSwapTokensForTokens(
      owner.address,
      config.addresses.miMatic,
      ethers.utils.parseUnits("0.001",18),
      config.addresses.usdc,
      ethers.utils.parseUnits("0.00098",6),
      Math.floor(Date.now() / 1000),
      {gasLimit: 500000}
    );

    console.log("The swap has been executed.");
}

main();