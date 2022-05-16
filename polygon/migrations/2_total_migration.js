require('dotenv').config({ path: `${__dirname}/../../.env` });

var CptcToken = artifacts.require('CptcToken');
var CptcHub = artifacts.require('CptcHub');
var StakingRewards = artifacts.require('StakingRewards')

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
    case 'polygonFork':
        const tokenAddress = '0x0a97853c72cB28C98B3112AE45215391675CAc43'
        const pairTokenAddress = '0x7Cf69af2a017452754f7fBbc36D4a12cc5Bc631B'
        await deployer.deploy(
            StakingRewards,
            '0x3556e77f33dfd3c07dff3da4c5c26eaaf92feab7',
            tokenAddress,
            pairTokenAddress,
            { gas: 6000000, from: '0x3556e77f33dfd3c07dff3da4c5c26eaaf92feab7' }
        )
        break;
    case 'mumbai':
        await deployer.deploy(CptcHub, { gas: 6000000, from: accounts[0] })
            .then((result) => {
                hub = result;
                console.log('hub contract address: ', hub.address);
                console.log('hub contract owner: ', accounts[0]);
            });
        const mumbai_initialMintPublicKey = process.env.MUMBAI_INITIAL_MINT_PUBLIC_KEY;
        token = await deployer.deploy(CptcToken, hub.address, mumbai_initialMintPublicKey);
        console.log('token contract address: ', token.address);
        break;
    case 'live':
        // this is deployer address for hub contract
        // it will also be the owner
        // For the future we will need this account for enabling 
        // minting/burning of CPTC tokens through contracts
        const deployerAddress = accounts[0];
        await deployer.deploy(CptcHub, { gas: 6000000, from: deployerAddress })
            .then((result) => {
                hub = result;
                console.log('hub contract address: ', hub.address);
                console.log('hub contract owner: ', deployerAddress);
            });
        // initial minting volume will be transfered to this address
        const live_initialMintPublicKey = process.env.MUMBAI_INITIAL_MINT_PUBLIC_KEY;
        token = await deployer.deploy(CptcToken, hub.address, live_initialMintPublicKey);
        console.log('token contract address: ', token.address);
        break;
    default:
        console.warn('Please use one of the following network identifiers: test, ganache, rinkeby, live');
        break;
    }
};
