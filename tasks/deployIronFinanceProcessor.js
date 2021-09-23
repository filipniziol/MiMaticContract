const fs = require('fs');

async function deployIronFinanceProcessor() {
    // We get the contract to deploy
    const [owner] = await ethers.getSigners();

    const IronFinanceProcessor = await ethers.getContractFactory("IronFinanceProcessor");

    ironFinanceProcessor = await IronFinanceProcessor.deploy(
        "0xd05e3E715d945B59290df0ae8eF85c1BdB684744"
        , {gasPrice: ethers.utils.parseUnits('10', 'gwei')}
    );


    console.log("IronFinanceProcessor deployed to:", ironFinanceProcessor.address);
}
  
module.exports = deployIronFinanceProcessor;
