const ethers = require('ethers');
const { expect } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const {
	takeSnapshot, 
	restoreSnapshot
} = require('./utils/helpers');
const constants = require('../constants.json');

const CollectionsRegistry = artifacts.require("CollectionsRegistry");
const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol");
const CptcHub = artifacts.require('CptcHub');

contract('CollectionsRegistry contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let registry;
    let cptc;
    let cptcHub;
    let lastSnapshotId;

    before(async () => {
        cptcHub = await CptcHub.deployed();
        registry = await CollectionsRegistry.new(wealthyAddress, cptcHub.address);
        cptc = await IERC20.at(constants.liveTokenAddress);
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });

    describe('Marketeer Management', () => {
        it('should check the admin role', async () => {
            const isAdmin = await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), wealthyAddress);
            await expect(isAdmin).to.be.true;
		});

        it('should not allow adding new marketeer by non admin', async () => {
            await expectRevert.unspecified(registry.addMarketeer(accounts[1], { from: accounts[1] }));
        });

        it('should add new marketeer', async () => {
            const receipt = await registry.addMarketeer(accounts[0], { from: wealthyAddress });
            await expectEvent(receipt, 'RoleGranted');
            await expect(await registry.hasRole(await registry.MARKETEER_ROLE(), accounts[0])).to.be.true;
        });

        it('should not allow marketeer role to add other marketeers', async () => {
            await expectRevert.unspecified(registry.addMarketeer(accounts[1], { from: accounts[0] }));
        });

        it('should not allow marketeer role to remove marketeers', async () => {
            await expectRevert.unspecified(registry.addMarketeer(accounts[0], { from: accounts[0] }));
        });

        it('should remove marketeer', async () => {
            const receipt = await registry.removeMarketeer(accounts[0], { from: wealthyAddress });
            await expectEvent(receipt, 'RoleRevoked');
            await expect(await registry.hasRole(await registry.MARKETEER_ROLE(), accounts[0])).to.be.false;
        });
    });

    describe('Registration logic', () => {
        const maCategory = ethers.utils.formatBytes32String("Modern Art");
        const otherCategory = ethers.utils.formatBytes32String("Other");
        const someCollections = [
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase(),
            '0xa39Fd6e51aad88F6F4ce6aB4427279cffFc11111'.toLowerCase()
        ];

        before(async () => {
            // add marketeer
            await registry.addMarketeer(accounts[0], { from: wealthyAddress });    
        });

        it('should not allow non admin to add category', async () => {
            await expectRevert.unspecified(registry.addCategory(maCategory, { from: accounts[0] }));
		});

        it('should add new category and call getters', async () => {
            const receipt = await registry.addCategory(maCategory, { from: wealthyAddress });
            await expectEvent(receipt, 'CategoryAdded');
            
            const category = await registry.getCategory(0);
            await expect(category).to.eq(maCategory);

            const categories = await registry.getAllCategories();
            await expect(categories.length).to.eq(1);
            await expect(categories[0]).to.eq(category);
        });

        it('should not allow non admin to remove category', async () => {
            await expectRevert.unspecified(registry.removeCategory(maCategory, { from: accounts[0] }));
		});

        it('should remove category and call getters', async () => {
            const receipt = await registry.removeCategory(maCategory, { from: wealthyAddress });
            await expectEvent(receipt, 'CategoryRemoved');
            
            await expectRevert.unspecified(registry.getCategory(0));

            const categories = await registry.getAllCategories();
            await expect(categories.length).to.eq(0);
        });

        it('should not allow non admin to add categories', async () => {
            await expectRevert.unspecified(registry.addCategories([maCategory, otherCategory], { from: accounts[0] }));
		});

        it('should add new categories and call getters', async () => {
            const receipt = await registry.addCategories([maCategory, otherCategory], { from: wealthyAddress });
            await expectEvent(receipt, 'CategoryBulkAdded');
            
            const category0 = await registry.getCategory(0);
            await expect(category0).to.eq(maCategory);

            const category1 = await registry.getCategory(1);
            await expect(category1).to.eq(otherCategory);

            const categories = await registry.getAllCategories();
            await expect(categories.length).to.eq(2);
            await expect(categories[0]).to.eq(maCategory);
            await expect(categories[1]).to.eq(otherCategory);
        });

        it('should not allow adding new collection by non marketeer', async () => {
            await expectRevert.unspecified(registry.registerCollection(someCollections[0], maCategory, { from: accounts[1] }));
        });

        it('should not allow adding new collection in invalid category', async () => {
            await expectRevert.unspecified(
                registry.registerCollection(someCollections[0], ethers.utils.formatBytes32String("Invalid Category"), { from: accounts[0] })
            );
        });

        it('should add new collection and call getters', async () => {
            const receipt = await registry.registerCollection(someCollections[0], maCategory, { from: accounts[0] });
            await expectEvent(receipt, 'CollectionRegistered');
            
            const category = await registry.getCollectionCategory(someCollections[0]);
            await expect(category).to.eq(maCategory);

            const collections = await registry.getAllCategoryCollections(maCategory);
            await expect(collections.length).to.eq(1);
            await expect(collections[0].toLowerCase()).to.eq(someCollections[0]);
        });

        it('should not allow changing collection category by non marketeer', async () => {
            await expectRevert.unspecified(registry.changeCollectionCategory(someCollections[0], otherCategory, { from: accounts[1] }));
        });

        it('should not allow changing collection category to invalid category', async () => {
            await expectRevert.unspecified(
                registry.changeCollectionCategory(someCollections[0], ethers.utils.formatBytes32String("Invalid Category"), { from: accounts[0] })
            );
        });

        it('should not allow changing collection category of non registered collection', async () => {
            await expectRevert.unspecified(
                registry.changeCollectionCategory(someCollections[1], otherCategory, { from: accounts[0] })
            );
        });

        it('should change collection category', async () => {
            const receipt = await registry.changeCollectionCategory(someCollections[0], otherCategory, { from: accounts[0] });
            await expectEvent(receipt, 'CollectionCategoryChanged');
            
            const category = await registry.getCollectionCategory(someCollections[0]);
            await expect(category).to.eq(otherCategory);

            const maCollections = await registry.getAllCategoryCollections(maCategory);
            await expect(maCollections.length).to.eq(0);
            
            const otherCollections = await registry.getAllCategoryCollections(otherCategory);
            await expect(otherCollections.length).to.eq(1);
            await expect(otherCollections[0].toLowerCase()).to.eq(someCollections[0]);
        });

        it('should not allow unregistering collection by non marketeer', async () => {
            await expectRevert.unspecified(registry.unregisterCollection(someCollections[0], { from: accounts[1] }));
        });

        it('should not allow unregistering non registered collection', async () => {
            await expectRevert.unspecified(
                registry.unregisterCollection(someCollections[1], { from: accounts[0] })
            );
        });

        it('should unregister collection', async () => {
            const receipt = await registry.unregisterCollection(someCollections[0], { from: accounts[0] });
            await expectEvent(receipt, 'CollectionUnregistered');
            
            const category = await registry.getCollectionCategory(someCollections[0]);
            await expect(category).to.eq(ethers.utils.formatBytes32String(""));

            const maCollections = await registry.getAllCategoryCollections(maCategory);
            await expect(maCollections.length).to.eq(0);
            
            const otherCollections = await registry.getAllCategoryCollections(otherCategory);
            await expect(otherCollections.length).to.eq(0);
        });
    });

    describe('Registration fee stuff', () => {
        const maCategory = ethers.utils.formatBytes32String("Modern Art");
        const someCollections = [
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase(),
            '0xa39Fd6e51aad88F6F4ce6aB4427279cffFc11111'.toLowerCase()
        ];

        before(async () => {
            // add marketeer
            await registry.addMarketeer(accounts[0], { from: wealthyAddress });    
        });

        it('should not allow changing fee by non admin', async () => {
            await expectRevert.unspecified(registry.changeRegistrationFee(10, { from: accounts[0] }));
        });

        it('should change fee and call getters', async () => {
            const receipt = await registry.changeRegistrationFee(1000, { from: wealthyAddress });
            await expectEvent(receipt, 'RegistrationFeeChanged');
            
            const fee = await registry.registrationFee();
            await expect(fee.toString()).to.eq('1000');
        });

        it('should not allow marketeer to register collection without covering fee', async () => {
            await expectRevert.unspecified(
                registry.registerCollection(someCollections[0], maCategory, { from: accounts[0] })
            );
        });

        it('should add new collection and call getters, covering fee', async () => {
            await cptc.transfer(accounts[0], 10000, { from: wealthyAddress });
            await cptc.approve(registry.address, 10000, { from: accounts[0] });

            const receipt = await registry.registerCollection(someCollections[0], maCategory, { from: accounts[0] });
            await expectEvent(receipt, 'CollectionRegistered');

            await expect((await cptc.balanceOf(registry.address)).toString()).to.equal('1000');
            await expect((await cptc.balanceOf(accounts[0])).toString()).to.equal('9000');
            
            const category = await registry.getCollectionCategory(someCollections[0]);
            await expect(category).to.eq(maCategory);

            const collections = await registry.getAllCategoryCollections(maCategory);
            await expect(collections.length).to.eq(1);
            await expect(collections[0].toLowerCase()).to.eq(someCollections[0]);
        });

        it('should not allow withdraw by non admin', async () => {
            await expectRevert.unspecified(registry.withdraw({ from: accounts[0] }));
        });

        it('should withdraw', async () => {
            const receipt = await registry.withdraw({ from: wealthyAddress });
            await expectEvent(receipt, 'Withdrawal');

            await expect((await cptc.balanceOf(registry.address)).toString()).to.equal('0');
        });
    });
});
