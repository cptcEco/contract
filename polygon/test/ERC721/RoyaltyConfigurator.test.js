const ethers = require('ethers');
const { expect } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const {
	takeSnapshot, 
	restoreSnapshot
} = require('../utils/helpers');
const constants = require('../../constants.json');
const RoyaltyExample = artifacts.require('RoyaltyExample');


contract('RoyaltyConfigurator contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let royalty;
    let lastSnapshotId;
    before(async () => {
        royalty = await RoyaltyExample.new(wealthyAddress, { from: wealthyAddress })
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    describe('Royalty stuff', () => {
		it('should try setting default royalty and fail', async () => {
            await expectRevert(royalty.setDefaultRoyalty(10, { from: accounts[1] }), "Ownable: caller is not the owner");
		});

        it('should set default royalty', async () => {
            await royalty.setDefaultRoyalty(10, { from: wealthyAddress });

            const royaltyData = await royalty.getDefaultRoyalty();
            await expect(royaltyData[0]).to.equal(royalty.address);
            await expect(royaltyData[1].toString()).to.eq('10');
        });

        it('should add token royalty', async () => {
            await expectRevert(royalty.setTokenRoyalty(0, 10, { from: accounts[1] }), "Ownable: caller is not the owner");
            await royalty.setTokenRoyalty(0, 10, { from: wealthyAddress });
        });
    });
});
