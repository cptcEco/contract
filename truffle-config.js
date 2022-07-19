require('dotenv').config({ path: `${__dirname}/.env` });
// // eslint-disable-next-line import/no-extraneous-dependencies
var HDWalletProvider = require('@truffle/hdwallet-provider');

const mumbai_deployerPrivateKey = process.env.MUMBAI_DEPLOYER_PRIVATE_KEY;
const mumbai_rpcEndpoint = process.env.MUMBAI_ACCESS_KEY;

const live_deployerPrivateKey = process.env.LIVE_DEPLOYER_PRIVATE_KEY;
const live_rpcEndpoint = process.env.LIVE_ACCESS_KEY;

module.exports = {
    compilers: {
        solc: {
            version: "0.8.5",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
            },
        },
    },
    networks: {
        ganache: {
            host: '127.0.0.1',
            port: 7545,
            gas: 6000000,
            network_id: '5777',
        },
        test: {
            host: '127.0.0.1',
            port: 7545,
            gas: 6000000,
            network_id: '137',
        },
        mumbai: {
            host: mumbai_rpcEndpoint, // Connect to geth on the specified
            provider: () => new HDWalletProvider([mumbai_deployerPrivateKey], mumbai_rpcEndpoint, 0, 1),
            network_id: 80001,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
        live: {
            host: live_rpcEndpoint,
            provider: () => new HDWalletProvider([private_key], live_rpcEndpoint, 0, 1),
            network_id: 137,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
    },
};
