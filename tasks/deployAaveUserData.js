const fs = require('fs');

async function deployAaveUserData() {
    // We get the contract to deploy
    const [owner] = await ethers.getSigners();

    const AaveUserData = await ethers.getContractFactory("AaveUserData");

    aaveUserData = await AaveUserData.deploy(
        "0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf"
        , {gasPrice: ethers.utils.parseUnits('30', 'gwei')}
    );


    console.log("AaveUserData deployed to:", aaveUserData.address);
}
  
module.exports = deployAaveUserData;