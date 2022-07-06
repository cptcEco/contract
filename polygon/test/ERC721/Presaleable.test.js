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
const PresaleableERC20Example = artifacts.require('PresaleableERC20Example');
const PresaleableNativeExample = artifacts.require('PresaleableNativeExample');

contract('Presaleable contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let presaleableERC20;
    let presaleableNative;
    let usdc;
    let lastSnapshotId;
    before(async () => {
        usdc = await IERC20.at(constants.liveUSDC);
        presaleableERC20 = await PresaleableERC20Example.new(constants.liveUSDC, { from: wealthyAddress });
        presaleableNative = await PresaleableNativeExample.new({ from: wealthyAddress });
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    describe('Presaleable general stuff', () => {
		it('should check sale is not in progress', async () => {
            await expect(await presaleableERC20.preSaleInProgress()).to.be.false;
		});

        it('should try starting presale from non owner and fail', async () => {
            await expectRevert(presaleableERC20.startPreSale({ from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should try stopping non started presale and fail', async () => {
            await expectRevert(presaleableERC20.stopPreSale({ from: wealthyAddress }), "Pre-sale not in progress");
        });

        it('should start pre-sale', async () => {
            await presaleableERC20.startPreSale({ from: wealthyAddress });
            await expect(await presaleableERC20.preSaleInProgress()).to.be.true;
        });

        it('should try stopping presale from non owner and fail', async () => {
            await expectRevert(presaleableERC20.stopPreSale({ from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should try starting non stopped sale and fail', async () => {
            await expectRevert(presaleableERC20.startPreSale({ from: wealthyAddress }), "Pre-sale in progress");
        });

        it('should stop pre-sale', async () => {
            await presaleableERC20.stopPreSale({ from: wealthyAddress });
            await expect(await presaleableERC20.preSaleInProgress()).to.be.false;
        });

        it('should try setting presale price from non owner and fail', async () => {
            await expectRevert(presaleableERC20.setPreSalePrice(1000, { from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should set presale price and change currency', async () => {
            await presaleableERC20.setPreSalePrice(100, { from: wealthyAddress });
            await expect((await presaleableERC20.getPreSalePrice()).toString()).to.eq('100');
        });

        after(async () => {
            await restoreSnapshot(web3, lastSnapshotId);
        });
    });

    describe('PresaleableERC20', () => {
        it('should set presale price and change currency', async () => {
            await presaleableERC20.setPreSalePrice(100, { from: wealthyAddress });
            await expect((await presaleableERC20.getPreSalePrice()).toString()).to.eq('100');
        });

        it('should try minting while presale not in progress and fail', async () => {
            await expectRevert(presaleableERC20.preSaleMint(wealthyAddress, 10, { from: wealthyAddress }), "Pre-sale not in progress");
        });

        it('should start presale again (necessary for test flow)', async () => {
            await presaleableERC20.startPreSale({ from: wealthyAddress });
            await expect(await presaleableERC20.preSaleInProgress()).to.be.true;
        });
        
        it('should try presale minting with no whitelist and fail', async () => {
            await expectRevert(presaleableERC20.preSaleMint(wealthyAddress, 10, { from: wealthyAddress }), "Only whitelisted accounts");
        });

        it('should whitelist address', async () => {
            const receiptWhitelist = await presaleableERC20.whitelist(wealthyAddress, { from: wealthyAddress });
            await expectEvent(receiptWhitelist, 'Whitelist');
        });

        it('should try presale minting with no allowance and fail', async () => {
            await expectRevert(presaleableERC20.preSaleMint(wealthyAddress, 10, { from: wealthyAddress }), "Contract is not allowed to spend fullPrice");
        });

        it('should presale mint 10 tokens', async () => {
            await presaleableERC20.setPreSalePrice(100, { from: wealthyAddress });
            await usdc.approve(presaleableERC20.address, ethers.constants.MaxUint256, { from: wealthyAddress });

            await presaleableERC20.preSaleMint(wealthyAddress, 10, { from: wealthyAddress });
            await expect((await presaleableERC20.balanceOf(wealthyAddress)).toString()).to.eq('10');
            await expect((await usdc.balanceOf(presaleableERC20.address)).toString()).to.eq('1000');
        });
    });

    describe('PresaleableNative', () => {
		it('should try setting presale price from non owner and fail', async () => {
            await expectRevert(presaleableNative.setPreSalePrice(1000, { from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should set presale price', async () => {
            await presaleableNative.setPreSalePrice(100, { from: wealthyAddress });
            await expect((await presaleableNative.getPreSalePrice()).toString()).to.eq('100');
        });

        it('should try presale minting while presale not in progress and fail', async () => {
            await expectRevert(presaleableNative.preSaleMint(wealthyAddress, 10, { from: wealthyAddress }), "Pre-sale not in progress");
        });

        it('should start sale again (necessary for test flow) and set max vars', async () => {
            await presaleableNative.startPreSale({ from: wealthyAddress });
            await expect(await presaleableNative.preSaleInProgress()).to.be.true;
        });

        it('should try presale minting with no whitelist and fail', async () => {
            await expectRevert(presaleableNative.preSaleMint(wealthyAddress, 10, { from: wealthyAddress }), "Only whitelisted accounts");
        });

        it('should whitelist address', async () => {
            const receiptWhitelist = await presaleableNative.whitelist(wealthyAddress, { from: wealthyAddress });
            await expectEvent(receiptWhitelist, 'Whitelist');
        });

        it('should try presale minting with no msg.value and fail', async () => {
            await expectRevert(
                presaleableNative.preSaleMint(wealthyAddress, 10, { from: wealthyAddress }),
                "msg.value not enough"
            );
        });

        it('should presale mint 10 tokens', async () => {
            await presaleableNative.setPreSalePrice(100, { from: wealthyAddress });
            await presaleableNative.preSaleMint(wealthyAddress, 10, { from: wealthyAddress, value: 1000 });
            await expect((await presaleableNative.balanceOf(wealthyAddress)).toString()).to.eq('10');
        });
    });
});
