/**
 * @type import('hardhat/config').HardhatUserConfig
 */

 const {
  RINKEBY_PRIVATE_KEY,
  ALCHEMY_API_KEY_RINKEBY,
  GOERLI_PRIVATE_KEY, 
  ALCHEMY_API_KEY_GOERLI,
  etherscanApiKey
} = require('./secrets.json');


require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("hardhat-gas-reporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY_RINKEBY}`,
      accounts: [`${RINKEBY_PRIVATE_KEY}`]
    }, 
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY_GOERLI}`,
      accounts: [`${GOERLI_PRIVATE_KEY}`]
    }
  },

  etherscan: {
    apiKey: etherscanApiKey
  },
};
