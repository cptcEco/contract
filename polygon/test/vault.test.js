const ethers = require('ethers');
const { expect, assert } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const constants = require('../constants.json');
const {
	expandTo18Decimals,
	toUnit,
	getApprovalDigest
} = require('./utils/encoders')
const {
	onlyGivenAddressCanInvoke, 
	fastForward, 
	currentTime, 
	takeSnapshot, 
	restoreSnapshot
} = require('./utils/helpers')

const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol");
const CptcHub = artifacts.require('CptcHub');
const IUniswapV2Router02 = artifacts.require('IUniswapV2Router02');
const IWETH = artifacts.require('IWETH');
const Vault = artifacts.require('Vault');


contract('Vault contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;
    const DAY = 86400;
    const ZERO_BN = ethers.BigNumber.from('0')

    let cptcHub;
    let wmaticVault;
    let usdcVault;
    let sushiRouter;
    let usdc;
    let wmatic;
    let cptc;
    let lastSnapshotId;

    before(async () => {
        cptcHub = await CptcHub.deployed();
        sushiRouter = await IUniswapV2Router02.at(constants.liveSushiRouter);
        usdc = await IERC20.at(constants.liveUSDC);
        wmatic = await IERC20.at(constants.liveWMATIC);
        cptc = await IERC20.at(constants.liveTokenAddress);

        wmaticVault = await Vault.new(wealthyAddress, cptcHub.address, sushiRouter.address, wmatic.address);
        usdcVault = await Vault.new(wealthyAddress, cptcHub.address, sushiRouter.address, usdc.address)
    });

    beforeEach(async () => {
        lastSnapshotId = await takeSnapshot(web3);
    });

    afterEach(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    
    describe('Check addresses', () => {
		it('should get the right addresses', async () => {
			await expect(await wmaticVault.paymentToken()).to.equal(wmatic.address);
            await expect(await wmaticVault.sushiRouter()).to.equal(sushiRouter.address);
            await expect(await usdcVault.paymentToken()).to.equal(usdc.address);
            await expect(await usdcVault.sushiRouter()).to.equal(sushiRouter.address);
		});
	});

    describe('Convert tokens', () => {
		it('should convert from wmatic (small path)', async () => {
            const wmaticValue = toUnit(1.0);

            const transferReceipt = await wmatic.transfer(wmaticVault.address, wmaticValue, { from: wealthyAddress });
            await expectEvent(transferReceipt, 'Transfer');
            await expect((await wmatic.balanceOf(wmaticVault.address)).toString()).to.equal(wmaticValue.toString());
            await expect((await cptc.balanceOf(wmaticVault.address)).toString()).to.equal(ZERO_BN.toString());

            const receipt = await wmaticVault.convertERC20();
            await expectEvent(receipt, 'TokenConverted');

            await expect((await wmatic.balanceOf(wmaticVault.address)).toString()).to.equal(ZERO_BN.toString());
            assert.isTrue((await cptc.balanceOf(wmaticVault.address)).gt(ZERO_BN));
		});

        it('should convert from usdc (bigger path)', async () => {
            const usdcValue = ethers.utils.parseUnits('0.0000000001');

            const transferReceipt = await usdc.transfer(usdcVault.address, usdcValue, { from: wealthyAddress });
            await expectEvent(transferReceipt, 'Transfer');
            await expect((await usdc.balanceOf(usdcVault.address)).toString()).to.equal(usdcValue.toString());
            await expect((await cptc.balanceOf(usdcVault.address)).toString()).to.equal(ZERO_BN.toString());

            const receipt = await usdcVault.convertERC20();
            await expectEvent(receipt, 'TokenConverted');

            await expect((await usdc.balanceOf(usdcVault.address)).toString()).to.equal(ZERO_BN.toString());
            assert.isTrue((await cptc.balanceOf(usdcVault.address)).gt(ZERO_BN));
        });

        it.skip('should convert from native currency (matic)', async () => {
            const maticValue = toUnit(1.0);

            const maticWithdrawInterface = await IWETH.at(constants.liveWMATIC);
            const tx = await maticWithdrawInterface.withdraw(maticValue, { from: wealthyAddress });

            const provider = ethers.getDefaultProvider();
            // await expect((await provider.getBalance(wealthyAddress)).toString()).to.equal(maticValue.toString());

            await usdcVault.sendTransaction({ from: wealthyAddress, value: maticValue.toHexString() })

            await expect((await provider.getBalance(usdcVault.address)).toString()).to.equal(maticValue.toString());
            await expect((await cptc.balanceOf(usdcVault.address)).toString()).to.equal(ZERO_BN.toString());

            const receipt = await usdcVault.convertNativeCurrency();
            await expectEvent(receipt, 'NativeCurrencyConverted');

            await expect((await provider.getBalance(wealthyAddress)).toString()).to.equal(ZERO_BN.toString());
            assert.isTrue((await cptc.balanceOf(usdcVault.address)).gt(ZERO_BN));
        });
	});
});
