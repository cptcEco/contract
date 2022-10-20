require('dotenv').config({ path: `${__dirname}/../.env` });

const CptcToken = artifacts.require('CptcToken');
const CptcHub = artifacts.require('CptcHub');
const StakingRewards = artifacts.require('StakingRewards');
const UniswapV2ERC20 = artifacts.require('UniswapV2ERC20');
const VaultFactory = artifacts.require('VaultFactory');
const StorefrontArt = artifacts.require('StorefrontArt');
const StorefrontMedia = artifacts.require('StorefrontMedia');
const StorefrontTicket = artifacts.require('StorefrontTicket');
const StorefrontRedeemable = artifacts.require('StorefrontRedeemable');
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
    case 'artcollections':
        const acdate = new Date();
        const acname = `ArtCollection-${acdate.getTime()}`;
        const acsymbol = `AC-${acdate.getTime()}`;
        const acprice = '1000000000000000000';
        const acdefaultWithdrawAddress = process.env.MUMBAI_DEPLOYER_PUBLIC_KEY;
        const actokenContractAddress = '0xe32E112aeA7a48992344c472889e1045dcB95551';
        const acbaseUri = 'ipfs://Qmf3gkv6DUjoMMtJVZd1KxiUhNjh9AqQshQ5xVQ1REgBA8/';
        const accontractUri = 'ipfs://QmNd3ztszQQQdaBH87zwst1d3u1G2t8PivnZbvkVYn1ycA/contract.json';
        
        await deployer.deploy(StorefrontArt, 
            acname,
            acsymbol,
            acprice,
            acdefaultWithdrawAddress,
            actokenContractAddress,
            acbaseUri,
            accontractUri).then(async (result) => {
                console.log(`Contract ${acname} deployed on address: ${result.address}`);
                await result.startSale();
                console.log('Sale started');
            });
        break;
    case 'mediacollections':
        const mcdate = new Date();
        const mcname = `MediaCollection-${mcdate.getTime()}`;
        const mcsymbol = `MC-${mcdate.getTime()}`;
        const mcprice = '1000000000000000000';
        const mcdefaultWithdrawAddress = process.env.MUMBAI_DEPLOYER_PUBLIC_KEY;
        const mctokenContractAddress = '0xe32E112aeA7a48992344c472889e1045dcB95551';
        const mcbaseUri = 'ipfs://QmWbJLVmEBHU9zfLCBM4VAuTyQRN5P6KBREPi24Bzpivba/1.json';
        const mccontractUri = 'ipfs://QmWbJLVmEBHU9zfLCBM4VAuTyQRN5P6KBREPi24Bzpivba/contract.json';
        
        await deployer.deploy(StorefrontMedia, 
            mcname,
            mcsymbol,
            mcprice,
            mcdefaultWithdrawAddress,
            mcbaseUri,
            mccontractUri,
            mctokenContractAddress).then(async (result) => {
                console.log(`Contract ${name} deployed on address: ${result.address}`);
                await result.startSale();
                console.log('Sale started');
            });
        break;
    case 'ticketcollections':
        const tcdate = new Date();
        const tcname = `TicketCollection-${tcdate.getTime()}`;
        const tcsymbol = `TC-${tcdate.getTime()}`;
        const tcprice = '1000000000000000000';
        const tcdefaultWithdrawAddress = process.env.MUMBAI_DEPLOYER_PUBLIC_KEY;
        const tctokenContractAddress = '0xe32E112aeA7a48992344c472889e1045dcB95551';
        const tcbaseUri = 'ipfs://Qmf3gkv6DUjoMMtJVZd1KxiUhNjh9AqQshQ5xVQ1REgBA8/';
        const tcpostRedeemUri = 'ipfs://QmNd3ztszQQQdaBH87zwst1d3u1G2t8PivnZbvkVYn1ycA/';
        const tccontractUri = 'ipfs://QmNd3ztszQQQdaBH87zwst1d3u1G2t8PivnZbvkVYn1ycA/contract.json';
        
        await deployer.deploy(StorefrontTicket, 
            tcname,
            tcsymbol,
            tcprice,
            tcdefaultWithdrawAddress,
            tcbaseUri,
            tccontractUri,
            tcpostRedeemUri,
            tokenContractAddress).then(async (result) => {
                console.log(`Contract ${name} deployed on address: ${result.address}`);
                await result.startSale();
                console.log('Sale started');
            });
        break;
    case 'redeemablecollections':
        const date = new Date();
        const name = `RedeemableCollection-${date.getTime()}`;
        const symbol = `RC-${date.getTime()}`;
        const price = '1000000000000000000';
        const defaultWithdrawAddress = process.env.MUMBAI_DEPLOYER_PUBLIC_KEY;
        const tokenContractAddress = '0xe32E112aeA7a48992344c472889e1045dcB95551';
        const baseUri = 'ipfs://Qmf3gkv6DUjoMMtJVZd1KxiUhNjh9AqQshQ5xVQ1REgBA8/';
        const postRedeemUri = 'ipfs://QmNd3ztszQQQdaBH87zwst1d3u1G2t8PivnZbvkVYn1ycA/';
        const contractUri = 'ipfs://QmNd3ztszQQQdaBH87zwst1d3u1G2t8PivnZbvkVYn1ycA/contract.json';
        
        await deployer.deploy(StorefrontRedeemable, 
            name,
            symbol,
            price,
            defaultWithdrawAddress,
            baseUri,
            contractUri,
            postRedeemUri,
            tokenContractAddress).then(async (result) => {
                console.log(`Contract ${name} deployed on address: ${result.address}`);
                await result.startSale();
                console.log('Sale started');
            });
        break;
    default:
        console.warn('Please use one of the following network identifiers: test, ganache, rinkeby, live');
        break;
    }
};
