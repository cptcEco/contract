const ethers = require('ethers');
const { expect } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const {
	takeSnapshot, 
	restoreSnapshot
} = require('../utils/helpers');
const constants = require('../../constants.json');
const DroppableExample = artifacts.require('DroppableExample');

contract('Droppable contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let droppable;
    let lastSnapshotId;
    before(async () => {
        droppable = await DroppableExample.new({ from: wealthyAddress })
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    describe('Airdrop', () => {
		it('should try airdropping and fail', async () => {
            await expectRevert(droppable.airdrop([accounts[1]], { from: accounts[1] }), "Ownable: caller is not the owner");
		});

        it('should airdrop tokens', async () => {
            const receipt = await droppable.airdrop([accounts[1], accounts[2]], { from: wealthyAddress });
            await expectEvent(receipt, 'Airdropped');

            await expect((await droppable.balanceOf(accounts[1])).toString()).to.eq('1');
            await expect((await droppable.balanceOf(accounts[2])).toString()).to.eq('1');
        });
    });
});
