require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-gas-reporter");
require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {
            chainId: 31337
        },
        base: {
            url: "https://mainnet.base.org",
            accounts: []
        },
        arbitrumOne: {
            url: "https://arb1.arbitrum.io/rpc",
            accounts: []
        }
    },
    gasReporter: {
        enabled: true,
        currency: 'USD',
        // Thiết lập cấu hình Gas Native của Layer 2 (sử dụng ETH)
        token: 'ETH',
        gasPriceApi: "https://api.basescan.org/api?module=proxy&action=eth_gasPrice", // Target Base L2 gas fee
        outputFile: 'gas-report.txt',
        noColors: true
    }
};
