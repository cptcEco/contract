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

contract('CollectionsRegistry contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let registry;
    let lastSnapshotId;
    before(async () => {
        registry = await CollectionsRegistry.new(wealthyAddress);
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
            const receipt = registry.registerCollection(someCollections[0], maCategory, { from: accounts[0] });
            await expectEvent(receipt, 'CollectionRegistered');
            
            const category = await registry.getCollectionCategory(someCollections[0]);
            await expect(category).to.eq(maCategory);

            const collections = await registry.getAllCategoryCollections(maCategory);
            await expect(collections.length).to.eq(1);
            await expect(collections[0]).to.eq(someCollections[0]);
        });

        
    });
});
