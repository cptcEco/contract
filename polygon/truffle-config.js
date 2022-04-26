require('dotenv').config({ path: `${__dirname}/../.env` });
// // eslint-disable-next-line import/no-extraneous-dependencies
var HDWalletProvider = require('@truffle/hdwallet-provider');

const deployerPrivateKey = process.env.MUMBAI_DEPLOYER_PRIVATE_KEY;

const rpcEndpoint = process.env.MUMBAI_ACCESS_KEY;

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
            network_id: '*',
        },

        test: {
            host: '127.0.0.1',
            port: 7545,
            gas: 6000000,
            network_id: '1337',
        },
        mumbai: {
            host: rpcEndpoint, // Connect to geth on the specified
            provider: () => new HDWalletProvider([deployerPrivateKey], rpcEndpoint, 0, 1),
            network_id: 80001,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },

        // live: {
        //     host: 'rpcEndpoint',
        //     port: 8545,
        //     provider: () => new HDWalletProvider([private_key], rpc_endpoint, 1),
        //     network_id: 1,
        //     gas: 6000000, // Gas limit used for deploys
        //     websockets: true,
        //     skipDryRun: true,
        // },

    },
};
