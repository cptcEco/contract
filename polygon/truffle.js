// require('dotenv').config({ path: `${__dirname}/../../../.env` });
// // eslint-disable-next-line import/no-extraneous-dependencies
// var HDWalletProvider = require('@truffle/hdwallet-provider');

// const private_key = process.env.RINKEBY_PRIVATE_KEY;
// const rpc_endpoint = process.env.RINKEBY_ACCESS_KEY;

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
            network_id: '*',
        },

        // rinkeby: {
        //     host: 'localhost', // Connect to geth on the specified
        //     port: 8545,
        //     provider: () => new HDWalletProvider([private_key], rpc_endpoint, 4),
        //     network_id: 4,
        //     gas: 6500000, // Gas limit used for deploys
        //     websockets: true,
        //     skipDryRun: true,
        // },

        // live: {
        //     host: 'localhost',
        //     port: 8545,
        //     provider: () => new HDWalletProvider([private_key], rpc_endpoint, 1),
        //     network_id: 1,
        //     gas: 6000000, // Gas limit used for deploys
        //     websockets: true,
        //     skipDryRun: true,
        // },

    },
};
