const ethers = require('ethers');
const { expect, use } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { solidity } = require('ethereum-waffle');
const constants = require('../constants.json');
const {
	takeSnapshot, 
	restoreSnapshot,
} = require('./utils/helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const CptcHub = artifacts.require('CptcHub');
const VaultFactory = artifacts.require('VaultFactory');
const Vault = artifacts.require('Vault');
use(solidity);


function getCreate2Address(factoryAddress, owner, cptcHub, sushiRouter, paymentToken, bytecode) {
    const create2Inputs = [
        '0xff',
        factoryAddress,
        ethers.utils.keccak256(ethers.utils.solidityPack(
            ['address', 'address', 'address', 'address'],
            [owner, cptcHub, sushiRouter, paymentToken]
        )),
        ethers.utils.keccak256(bytecode)
    ];
    const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
    return ethers.utils.getAddress(`0x${ethers.utils.keccak256(sanitizedInputs).slice(-40)}`);
} 


contract('VaultFactory contract testing', async (accounts) => {
    const wealthyAddress = '0x3556e77f33Dfd3C07dff3da4C5C26EaaF92FEab7';

    let cptcHub;
    let vaultFactory;
    let lastSnapshotId;

    before(async () => {
        cptcHub = await CptcHub.deployed();
        vaultFactory = await VaultFactory.new(cptcHub.address, constants.liveSushiRouter, { from: wealthyAddress });
    });

    beforeEach(async () => {
        lastSnapshotId = await takeSnapshot(web3);
    });

    afterEach(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    
    describe('Check addresses', () => {
		it('should get the right addresses', async () => {
			await expect(await vaultFactory.cptcHub()).to.equal(cptcHub.address);
            await expect(await vaultFactory.sushiRouter()).to.equal(constants.liveSushiRouter);
		});
	});

    describe('Vault lifecycle', () => {
        let vaultAddress;

		it('should run vault creation and deletion lifecycle successfully', async () => {
            vaultAddress = getCreate2Address(
                vaultFactory.address,
                wealthyAddress,
                cptcHub.address,
                constants.liveSushiRouter,
                constants.liveUSDC,
                Vault.bytecode
            );

            const receipt = await vaultFactory.createVault(
                constants.liveNftCollection,
                constants.liveUSDC,
                { from: wealthyAddress }
            )
            await expectEvent(receipt, 'VaultCreated', {
                owner: wealthyAddress,
                vault: vaultAddress,
                collection: constants.liveNftCollection,
                paymentToken: constants.liveUSDC
            });
            const vault = await Vault.at(vaultAddress);
            await expect(await vault.factory()).to.eq(vaultFactory.address);

            const owners = await vaultFactory.getOwners();
            await expect(owners.length).to.eq(1);
            await expect(owners[0]).to.eq(wealthyAddress);

            const ownerVaults = await vaultFactory.getOwnerVaults(wealthyAddress);
            await expect(ownerVaults.length).to.eq(1);
            await expect(ownerVaults[0]).to.eq(vaultAddress);

            const collection = await vaultFactory.getVaultCollection(vaultAddress);
            await expect(collection).to.eq(constants.liveNftCollection);

            const vaultAddressFromCollection = await vaultFactory.getCollectionVault(constants.liveNftCollection);
            await expect(vaultAddressFromCollection).to.eq(vaultAddress);

            const vaultCollectionPairs = await vaultFactory.getOwnerVaultCollectionPairs(wealthyAddress);
            await expect(vaultCollectionPairs['0'][0]).to.eq(vaultAddress);
            await expect(vaultCollectionPairs['1'][0]).to.eq(constants.liveNftCollection);
            
            await expectRevert(vault.destroy({ from: wealthyAddress }), "Caller is not the factory");
            await expectRevert(
                vaultFactory.deleteVault(vaultAddress, { from: constants.liveMaticWealthyAddress }), 
                "Caller is not the vault owner"
            );

            const receiptDelete = await vaultFactory.deleteVault(vaultAddress, { from: wealthyAddress });
            await expectEvent(receiptDelete, 'VaultDeleted', {
                owner: wealthyAddress,
                vault: vaultAddress,
                collection: constants.liveNftCollection
            });

            await expect(await web3.eth.getCode(vaultAddress)).to.eq('0x');

            const ownersAfterDelete = await vaultFactory.getOwners();
            await expect(ownersAfterDelete.length).to.eq(0);

            const ownerVaultsAfterDelete = await vaultFactory.getOwnerVaults(wealthyAddress);
            await expect(ownerVaultsAfterDelete.length).to.eq(0);

            const collectionAfterDelete = await vaultFactory.getVaultCollection(vaultAddress);
            await expect(collectionAfterDelete).to.eq('0x0000000000000000000000000000000000000000');

            const vaultAddressFromCollectionAfterDelete = await vaultFactory.getCollectionVault(constants.liveNftCollection);
            await expect(vaultAddressFromCollectionAfterDelete).to.eq('0x0000000000000000000000000000000000000000');

            const vaultCollectionPairsAfterDelete = await vaultFactory.getOwnerVaultCollectionPairs(wealthyAddress);
            await expect(vaultCollectionPairsAfterDelete['0'].length).to.eq(0);
            await expect(vaultCollectionPairsAfterDelete['1'].length).to.eq(0);
        });
	});

    describe('setHubAddress', () => {
        it('should not be able to change address because not owner', async () => {
            const newCptcHub = await CptcHub.new();
            await expectRevert(vaultFactory.setHubAddress(newCptcHub.address, { from: accounts[1] }), "Ownable: caller is not the owner");
        });

		it('should change the address of Hub to a new CptcHub', async () => {
			const newCptcHub = await CptcHub.new();
            const receipt = await vaultFactory.setHubAddress(newCptcHub.address, { from: wealthyAddress });
            await expectEvent(receipt, 'HubAddressModified');
		});
	});
});
