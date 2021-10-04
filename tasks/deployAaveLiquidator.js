const fs = require('fs');

async function deployAaveLiquidator() {
    // We get the contract to deploy
    const [owner] = await ethers.getSigners();

    const AaveLiquidator = await ethers.getContractFactory("AaveLiquidator");

    aaveLiquidator = await AaveLiquidator.deploy(
        "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
        "0xd05e3E715d945B59290df0ae8eF85c1BdB684744", 
        {
            gasPrice: ethers.utils.parseUnits('30', 'gwei'),
            gasLimit: 5000000
        }
    );


    console.log("AaveLiquidator deployed to:", aaveLiquidator.address);
}
  
module.exports = deployAaveLiquidator;