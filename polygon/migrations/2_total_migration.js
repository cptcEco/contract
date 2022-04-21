// var BN = require('bn.js');

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
    case 'rinkeby':
    case 'live':
    default:
        console.warn('Please use one of the following network identifiers: test, ganache, rinkeby, live');
        break;
    }
};
