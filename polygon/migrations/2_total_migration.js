require('dotenv').config({ path: `${__dirname}/../../.env` });

const CptcToken = artifacts.require('CptcToken');
const CptcHub = artifacts.require('CptcHub');
const StakingRewards = artifacts.require('StakingRewards');
const UniswapV2ERC20 = artifacts.require('UniswapV2ERC20');
const VaultFactory = artifacts.require('VaultFactory');

const constants = require('../constants.json');

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
        await hub.setContractAddress('TokenContract', constants.liveTokenAddress, '3');
        await hub.setContractAddress('StakingTokenContract', constants.livePairTokenAddress, '3');
        await hub.setContractAddress('RewardsDistribution', constants.liveWealthyAddress, '3')
        
        await deployer.deploy(
            StakingRewards,
            hub.address,
            { gas: 6000000, from: constants.liveWealthyAddress }
        )

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
        await hub.setContractAddress('TokenContract', token.address, '3');
        console.log('token address: ', token.address);
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

        await hub.setContractAddress('TokenContract', constants.mumbaiTokenAddress, '3');
        await hub.setContractAddress('StakingTokenContract', constants.mumbaiPairTokenAddress, '3');
        await hub.setContractAddress('RewardsDistribution', constants.mumbaiWealthyAddress, '3')

        await deployer.deploy(
            VaultFactory,
            constants.mumbaiHubAddress,
            constants.mumbaiRouter
        )
        const factory = await VaultFactory.deployed();
        console.log('factory contract address: ', factory.address);

        // await deployer.deploy(UniswapV2ERC20, { gas: 6000000, from: accounts[0] })
        // const pair = await UniswapV2ERC20.deployed()
        // console.log(pair, pair.address)
        // await deployer.deploy(
        //     StakingRewards,
        //     constants.mumbaiHubAddress,
        //     { gas: 6000000, from: accounts[0] }
        // ) 
        // const stakingContract = await StakingRewards.deployed()
        // console.log('stakingRewards contract address: ', stakingContract.address)


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
