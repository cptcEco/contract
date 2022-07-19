const ethers = require('ethers');
const { expect } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const {
	takeSnapshot, 
	restoreSnapshot
} = require('../utils/helpers');
const constants = require('../../constants.json');

const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol");
const WithdrawableExample = artifacts.require('WithdrawableExample');


contract('Withdrawable contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let withdrawable
    let usdc;
    let wmatic;
    let lastSnapshotId;
    before(async () => {
        usdc = await IERC20.at(constants.liveUSDC);
        wmatic = await IERC20.at(constants.liveWMATIC);
        withdrawable = await WithdrawableExample.new(wealthyAddress, usdc.address, { from: wealthyAddress })
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    
    describe('Check variables', () => {
		it('should get variables', async () => {
			await expect((await withdrawable.withdrawTokenOnlyDefault()).toLowerCase()).to.eq(usdc.address.toLowerCase());
            await expect((await withdrawable.defaultWithdrawAddress()).toLowerCase()).to.equal(wealthyAddress.toLowerCase());
		});
	});

    describe('Withdraw addresses', () => {
		it('should try to set default withdraw address and fail', async () => {
            await expectRevert(withdrawable.setDefaultWithdrawAddress(accounts[0], { from: accounts[1] }), "Ownable: caller is not the owner");
		});

        it('should set new default withdraw address', async () => {
            const receipt = await withdrawable.setDefaultWithdrawAddress(accounts[0], { from: wealthyAddress });
            await expectEvent(receipt, 'SetDefaultAddress');

            await expect(await withdrawable.defaultWithdrawAddress()).to.equal(accounts[0]);
        });

        it('should try to add withdraw address and fail for various reasons', async () => {
            await expectRevert(withdrawable.setWithdrawAddress(accounts[0], 50, { from: accounts[1] }), "Ownable: caller is not the owner");
            await expectRevert(withdrawable.setWithdrawAddress(ethers.constants.AddressZero, 50, { from: wealthyAddress }), "Withdraw address cannot be 0x00");
            await expectRevert(withdrawable.setWithdrawAddress(accounts[1], 0, { from: wealthyAddress }), "Percentage cannot be 0");
            await expectRevert(withdrawable.setWithdrawAddress(accounts[1], 120, { from: wealthyAddress }), "Percentage cannot be greater than 100");
        });

        it('should add withdraw address', async () => {
            const receipt = await withdrawable.setWithdrawAddress(accounts[1], 40, { from: wealthyAddress });
            await expectEvent(receipt, 'SetWithdrawAddress');
            await expect((await withdrawable.getWithdrawAddresses())[0]).to.equal(accounts[1]);
            await expect((await withdrawable.withdrawAddressPercentages(accounts[1])).toString()).to.eq('40');
        });

        it('should change percentage of existing address', async () => {
            const receipt = await withdrawable.setWithdrawAddress(accounts[1], 30, { from: wealthyAddress });
            await expectEvent(receipt, 'SetWithdrawAddress');
            await expect((await withdrawable.getWithdrawAddresses())[0]).to.equal(accounts[1]);
            await expect((await withdrawable.withdrawAddressPercentages(accounts[1])).toString()).to.eq('30');
        });

        it('should fail adding withdraw address because percentages go over 100', async () => {
            await expectRevert(withdrawable.setWithdrawAddress(accounts[2], 80, { from: wealthyAddress }), "Percentage sum cannot be greater than 100");
        });

        it('should add withdraw address and remove it afterwards, and test reverts of remove', async () => {
            const receipt = await withdrawable.setWithdrawAddress(accounts[2], 40, { from: wealthyAddress });
            await expectEvent(receipt, 'SetWithdrawAddress');
            await expect((await withdrawable.getWithdrawAddresses()).length).to.equal(2);

            await expectRevert(withdrawable.removeWithdrawAddress(accounts[2], { from: accounts[1] }), "Ownable: caller is not the owner");
            await expectRevert(withdrawable.removeWithdrawAddress(ethers.constants.AddressZero, { from: wealthyAddress }), "Address cannot be 0x00");
            await expectRevert(withdrawable.removeWithdrawAddress(accounts[3], { from: wealthyAddress }), "Address not present");

            const removeReceipt = await withdrawable.removeWithdrawAddress(accounts[2], { from: wealthyAddress });
            await expectEvent(removeReceipt, 'RemoveWithdrawAddress');
            await expect((await withdrawable.getWithdrawAddresses()).length).to.equal(1);
        });
	});

    describe('withdraw functionality', () => {
		it('should transfer wmatic and usdc and test withdraw', async () => {
            const transferReceiptWmatic = await wmatic.transfer(withdrawable.address, 100, { from: wealthyAddress });
            await expectEvent(transferReceiptWmatic, 'Transfer');

            const transferReceiptUsdc = await usdc.transfer(withdrawable.address, 100, { from: wealthyAddress });
            await expectEvent(transferReceiptUsdc, 'Transfer');

            await withdrawable.withdraw(usdc.address, { from: accounts[2] });
            await expect((await usdc.balanceOf(accounts[0])).toString()).to.eq('100');

            const withdrawWmatic = await withdrawable.withdraw(wmatic.address, { from: accounts[1] });
            await expectEvent(withdrawWmatic, 'Withdraw');
            await expect((await wmatic.balanceOf(accounts[0])).toString()).to.eq('70');
            await expect((await wmatic.balanceOf(accounts[1])).toString()).to.eq('30');
		});
	});
});
