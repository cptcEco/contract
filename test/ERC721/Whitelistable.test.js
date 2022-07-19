const { expect } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const {
	takeSnapshot, 
	restoreSnapshot
} = require('../utils/helpers');
const constants = require('../../constants.json');
const WhitelistableExample = artifacts.require('WhitelistableExample');

contract('Whitelistable contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let whitelistable;
    let lastSnapshotId;
    before(async () => {
        whitelistable = await WhitelistableExample.new({ from: wealthyAddress })
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    describe('Change whitelist', () => {
		it('should try setting whitelist address and fail', async () => {
            await expectRevert(whitelistable.whitelist(accounts[1], { from: accounts[1] }), "Ownable: caller is not the owner");
            await expectRevert(whitelistable.whitelistBulk(accounts, { from: accounts[1] }), "Ownable: caller is not the owner");
		});

        it('should whitelist one and in bulk as well', async () => {
            const receiptWhitelist = await whitelistable.whitelist(accounts[1], { from: wealthyAddress });
            await expectEvent(receiptWhitelist, 'Whitelist');

            await whitelistable.whitelistBulk([accounts[2], accounts[3]], { from: wealthyAddress });
            const whitelisted = [accounts[1], accounts[2], accounts[3]];
            for (const address of whitelisted) {
                await expect(await whitelistable.isWhitelisted(address)).to.be.true;
            }
        });
    });
});
