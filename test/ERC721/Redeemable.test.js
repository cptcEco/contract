const { expect } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const {
	takeSnapshot, 
	restoreSnapshot
} = require('../utils/helpers');
const constants = require('../../constants.json');
const RedeemableExample = artifacts.require('RedeemableExample');

contract('Redeemable contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let redeemable;
    let lastSnapshotId;
    before(async () => {
        redeemable = await RedeemableExample.new({ from: wealthyAddress })
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    describe('Change redeemable', () => {
        it('should have redeem in progress', async () => {
            await expect(await redeemable.redeemInProgress()).to.be.false;
        });

		it('should try starting redeem as not owner and fail, and stop non started redeem', async () => {
            await expectRevert(redeemable.startRedeem({ from: accounts[1] }), "Ownable: caller is not the owner");
            await expectRevert(redeemable.stopRedeem({ from: wealthyAddress }), "Redeem not in progress");
		});

        it('should try redeeming while not in progress', async () => {
            await expectRevert(redeemable.redeem(1, { from: wealthyAddress }), "Redeem not in progress");
		});

        it('should start redeem and fail starting it after it, and fail stopping with not owner', async () => {
            const receipt = await redeemable.startRedeem({ from: wealthyAddress });
            await expectEvent(receipt, "RedeemStarted");
            await expect(await redeemable.redeemInProgress()).to.be.true;

            await expectRevert(redeemable.startRedeem({ from: wealthyAddress }), "Redeem in progress");
            await expectRevert(redeemable.stopRedeem({ from: accounts[1] }), "Ownable: caller is not the owner");
		});

        it('should redeem', async () => {
            await expectRevert(redeemable.redeem(1, { from: accounts[1] }), "Not owner of token");

            await expect(await redeemable.tokenURI(1)).to.eq("ipfs://override.me/1");
            
            const receipt = await redeemable.redeem(1, { from: wealthyAddress });
            await expectEvent(receipt, "Redeemed");

            await expect(await redeemable.tokenURI(1)).to.eq("postRedeemUrl/1");
        });

        it('should stop redeem', async () => {
            const receipt = await redeemable.stopRedeem({ from: wealthyAddress });
            await expectEvent(receipt, "RedeemStopped");
            await expect(await redeemable.redeemInProgress()).to.be.false;
        });
    });
});
