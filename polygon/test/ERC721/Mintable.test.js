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
const MintableERC20Example = artifacts.require('MintableERC20Example');
const MintableNativeExample = artifacts.require('MintableNativeExample');

contract('Mintable contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let mintableERC20;
    let mintableNative;
    let usdc;
    let lastSnapshotId;
    before(async () => {
        usdc = await IERC20.at(constants.liveUSDC);
        mintableERC20 = await MintableERC20Example.new(constants.liveUSDC, { from: wealthyAddress });
        mintableNative = await MintableNativeExample.new({ from: wealthyAddress });
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    describe('Mintable general stuff', () => {
		it('should check sale is not in progress', async () => {
            await expect(await mintableERC20.saleInProgress()).to.be.false;
		});

        it('should try starting sale from non owner and fail', async () => {
            await expectRevert(mintableERC20.startSale({ from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should try stopping non started sale and fail', async () => {
            await expectRevert(mintableERC20.stopSale({ from: wealthyAddress }), "Sale not in progress");
        });

        it('should start sale', async () => {
            const saleStartReceipt = await mintableERC20.startSale({ from: wealthyAddress });
            await expectEvent(saleStartReceipt, 'SaleStarted');
            await expect(await mintableERC20.saleInProgress()).to.be.true;
        });

        it('should try stopping sale from non owner and fail', async () => {
            await expectRevert(mintableERC20.stopSale({ from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should try starting non stopped sale and fail', async () => {
            await expectRevert(mintableERC20.startSale({ from: wealthyAddress }), "Sale in progress");
        });

        it('should stop sale', async () => {
            const saleStopReceipt = await mintableERC20.stopSale({ from: wealthyAddress });
            await expectEvent(saleStopReceipt, 'SaleStopped');
            await expect(await mintableERC20.saleInProgress()).to.be.false;
        });

        it('should try setting max per mint from non owner and fail', async () => {
            await expectRevert(mintableERC20.setMaxPerMint(1000, { from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should set max per mint', async () => {
            await mintableERC20.setMaxPerMint(1000, { from: wealthyAddress });
            await expect((await mintableERC20.maxPerMint()).toString()).to.eq('1000');
        });

        it('should try setting max mint per wallet from non owner and fail', async () => {
            await expectRevert(mintableERC20.setMaxMintPerWallet(1000, { from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should set max mint per wallet', async () => {
            await mintableERC20.setMaxMintPerWallet(1000, { from: wealthyAddress });
            await expect((await mintableERC20.maxMintsPerWallet()).toString()).to.eq('1000');
        });

        after(async () => {
            await restoreSnapshot(web3, lastSnapshotId);
        });
    });

    describe('MintableERC20', () => {
		it('should try setting price from non owner and fail', async () => {
            await expectRevert(mintableERC20.setPrice(1000, constants.liveWMATIC, { from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should set price and change currency', async () => {
            await mintableERC20.setPrice(100, constants.liveWMATIC, { from: wealthyAddress });
            await expect((await mintableERC20.price()).toString()).to.eq('100');
            await expect((await mintableERC20.currencyToken()).toLowerCase()).to.eq(constants.liveWMATIC.toLowerCase());
        });

        it('should try minting while sale not in progress and fail', async () => {
            await expectRevert(mintableERC20.mint(10, { from: wealthyAddress }), "Sale not in progress");
        });

        it('should start sale again (necessary for test flow) and set max vars', async () => {
            const saleStartReceipt = await mintableERC20.startSale({ from: wealthyAddress });
            await expectEvent(saleStartReceipt, 'SaleStarted');
            await expect(await mintableERC20.saleInProgress()).to.be.true;

            await mintableERC20.setMaxPerMint(20, { from: wealthyAddress });
            await expect((await mintableERC20.maxPerMint()).toString()).to.eq('20');

            await mintableERC20.setMaxMintPerWallet(100, { from: wealthyAddress });
            await expect((await mintableERC20.maxMintsPerWallet()).toString()).to.eq('100');
        });

        it('should try minting more than maxPerMint and fail', async () => {
            await expectRevert(mintableERC20.mint(30, { from: wealthyAddress }), "maxPerMint exceeded");
        });

        it('should try minting with no allowance and fail', async () => {
            await expectRevert(mintableERC20.mint(10, { from: wealthyAddress }), "Contract is not allowed to spend fullPrice");
        });

        it('should mint 10 tokens', async () => {
            await mintableERC20.setPrice(100, constants.liveUSDC, { from: wealthyAddress });
            await usdc.approve(mintableERC20.address, ethers.constants.MaxUint256, { from: wealthyAddress });

            await mintableERC20.mint(10, { from: wealthyAddress });
            await expect((await mintableERC20.balanceOf(wealthyAddress)).toString()).to.eq('10');
            await expect((await usdc.balanceOf(mintableERC20.address)).toString()).to.eq('1000');
        });
    });

    describe('MintableNative', () => {
		it('should try setting price from non owner and fail', async () => {
            await expectRevert(mintableNative.setPrice(1000, { from: accounts[1] }), "Ownable: caller is not the owner");
        });

        it('should set price', async () => {
            await mintableNative.setPrice(100, { from: wealthyAddress });
            await expect((await mintableNative.price()).toString()).to.eq('100');
        });

        it('should try minting while sale not in progress and fail', async () => {
            await expectRevert(mintableNative.mint(10, { from: wealthyAddress }), "Sale not in progress");
        });

        it('should start sale again (necessary for test flow) and set max vars', async () => {
            const saleStartReceipt = await mintableNative.startSale({ from: wealthyAddress });
            await expectEvent(saleStartReceipt, 'SaleStarted');
            await expect(await mintableNative.saleInProgress()).to.be.true;

            await mintableNative.setMaxPerMint(20, { from: wealthyAddress });
            await expect((await mintableNative.maxPerMint()).toString()).to.eq('20');

            await mintableNative.setMaxMintPerWallet(100, { from: wealthyAddress });
            await expect((await mintableNative.maxMintsPerWallet()).toString()).to.eq('100');
        });

        it('should try minting more than maxPerMint and fail', async () => {
            await expectRevert(mintableNative.mint(30, { from: wealthyAddress }), "maxPerMint exceeded");
        });

        it('should try minting with no msg.value and fail', async () => {
            await expectRevert(mintableNative.mint(10, { from: wealthyAddress }), "msg.value not enough");
        });

        it('should mint 10 tokens', async () => {
            await mintableNative.setPrice(100, { from: wealthyAddress });
            await mintableNative.mint(10, { from: wealthyAddress, value: 1000 });
            await expect((await mintableNative.balanceOf(wealthyAddress)).toString()).to.eq('10');
        });
    });
});
