require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat').HardhatUserConfig */
module.exports = {
  solidity: "0.8.0",
  networks: {
    xlayer: {
      url: process.env.RPC_URL || "https://rpc.xlayer.tech",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 196,
    },
  },
};
