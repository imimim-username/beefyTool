require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Placeholder networks - RPC URLs will be configured via environment variables
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      chainId: 1,
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "",
      chainId: 10,
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "",
      chainId: 42161,
    },
    base: {
      url: process.env.BASE_RPC_URL || "",
      chainId: 8453,
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};
