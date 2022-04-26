require('dotenv').config({ path: `${__dirname}/../../.env` });

const initialMintPublicKey = process.env.MUMBAI_INITIAL_MINT_PUBLIC_KEY;
var CptcToken = artifacts.require('CptcToken');
var CptcHub = artifacts.require('CptcHub');

module.exports = async (deployer, network, accounts) => {
    let hub;
    let token;

    switch (network) {
    case 'test':

        await deployer.deploy(CptcHub, { gas: 6000000, from: accounts[0] })
            .then((result) => {
                hub = result;
            });
        // await hub.setContractAddress('Owner', accounts[0], '0');

        token = await deployer.deploy(CptcToken, hub.address, accounts[1]);
        await hub.setContractAddress('Token', token.address, '3');

        break;
    case 'ganache':
        await deployer.deploy(CptcHub, { gas: 6000000, from: accounts[0] })
            .then((result) => {
                hub = result;
                console.log('hub address: ', hub.address);
            });
        // await hub.setContractAddress('Owner', accounts[0], '0');
        const ownerAddress = '0x8A7DEDbED3fD420886d3CA6EE3b629fbff1e1E35';
        token = await deployer.deploy(CptcToken, hub.address, ownerAddress);
        await hub.setContractAddress('Token', token.address, '3');
        console.log('token address: ', token.address);
        break;
    case 'mumbai':
        await deployer.deploy(CptcHub, { gas: 6000000, from: accounts[0] })
            .then((result) => {
                hub = result;
                console.log('hub contract address: ', hub.address);
                console.log('hub contract owner: ', accounts[0]);
            });
        token = await deployer.deploy(CptcToken, hub.address, accounts[1]);
        console.log('token contract address: ', token.address);
        break;
    case 'live':
        await deployer.deploy(CptcHub, { gas: 6000000, from: accounts[0] })
            .then((result) => {
                hub = result;
                console.log('hub contract address: ', hub.address);
                console.log('hub contract owner: ', accounts[0]);
            });
        token = await deployer.deploy(CptcToken, hub.address, initialMintPublicKey);
        console.log('token contract address: ', token.address);
        break;
    default:
        console.warn('Please use one of the following network identifiers: test, ganache, rinkeby, live');
        break;
    }
};
