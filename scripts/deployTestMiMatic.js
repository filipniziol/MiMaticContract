const network = hre.network.name;
const fs = require('fs');

async function main() {
    // We get the contract to deploy
    const [owner] = await ethers.getSigners();

    if(network === "mumbai"){
      const MIMATIC = await ethers.getContractFactory("TestERC20");

      const miMatic = await MIMATIC.deploy(
        "miMATIC",
        "miMATIC",
        18
      );

      console.log("miMATIC:", miMatic.address);
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });