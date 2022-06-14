const ethers = require('ethers');
const { expect, assert } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

const constants = require('../constants.json');
const { toUnit } = require('./utils/encoders')
const {
	takeSnapshot, 
	restoreSnapshot,
    mineBlock
} = require('./utils/helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol");
const CptcHub = artifacts.require('CptcHub');
const IUniswapV2Router02 = artifacts.require('IUniswapV2Router02');
const Vault = artifacts.require('Vault');


contract('Vault contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;
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

        wmaticVault = await Vault.new({ from: wealthyAddress });
        usdcVault = await Vault.new({ from: wealthyAddress });
        await wmaticVault.initialize(wealthyAddress, cptcHub.address, sushiRouter.address, wmatic.address, { from: wealthyAddress });
        await usdcVault.initialize(wealthyAddress, cptcHub.address, sushiRouter.address, usdc.address, { from: wealthyAddress });
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

        it('should convert from native currency (matic)', async () => {
            const maticValue = toUnit(1.0);

            await web3.eth.sendTransaction({
                from: constants.liveMaticWealthyAddress,
                value: maticValue,
                to: usdcVault.address
            });

            await mineBlock(web3);
            await expect((await web3.eth.getBalance(usdcVault.address)).toString()).to.equal(maticValue.toString());
            await expect((await cptc.balanceOf(usdcVault.address)).toString()).to.equal(ZERO_BN.toString());

            const receipt = await usdcVault.convertNativeCurrency();
            await expectEvent(receipt, 'NativeCurrencyConverted');

            assert.isTrue((await cptc.balanceOf(usdcVault.address)).gt(ZERO_BN));
        });
	});

    describe('Airdrop/withdraw tokens', () => {
		it('should convert from wmatic and drop tokens for all accounts', async () => {
            const wmaticValue = toUnit(1.0);

            const transferReceipt = await wmatic.transfer(wmaticVault.address, wmaticValue, { from: wealthyAddress });
            await expectEvent(transferReceipt, 'Transfer');
            await expect((await wmatic.balanceOf(wmaticVault.address)).toString()).to.equal(wmaticValue.toString());
            await expect((await cptc.balanceOf(wmaticVault.address)).toString()).to.equal(ZERO_BN.toString());

            const receipt = await wmaticVault.convertERC20();
            await expectEvent(receipt, 'TokenConverted');

            await expect((await wmatic.balanceOf(wmaticVault.address)).toString()).to.equal(ZERO_BN.toString());
            
            const cptcValue = await cptc.balanceOf(wmaticVault.address);
            assert.isTrue(cptcValue.gt(ZERO_BN));
            
            const dropAddresses = [];
            for (account of accounts) {
                if ((await cptc.balanceOf(account)).toString() === ZERO_BN.toString()) {
                    dropAddresses.push(account)
                }
            }
            
            const dropValue = ethers.BigNumber.from(cptcValue.toString()).div(ethers.BigNumber.from(100));
            const dropReceipt = await wmaticVault.dropTokens(dropAddresses, dropAddresses.map((_) => dropValue), { from: wealthyAddress });
            await expectEvent(dropReceipt, 'TokensDropped');
            for (account of dropAddresses) {
                await expect((await cptc.balanceOf(account)).toString()).to.equal(dropValue.toString());
            }
		});

        it('should convert from wmatic and withdraw all tokens', async () => {
            const wmaticValue = toUnit(1.0);

            const transferReceipt = await wmatic.transfer(wmaticVault.address, wmaticValue, { from: wealthyAddress });
            await expectEvent(transferReceipt, 'Transfer');
            await expect((await wmatic.balanceOf(wmaticVault.address)).toString()).to.equal(wmaticValue.toString());
            await expect((await cptc.balanceOf(wmaticVault.address)).toString()).to.equal(ZERO_BN.toString());

            const receipt = await wmaticVault.convertERC20();
            await expectEvent(receipt, 'TokenConverted');

            await expect((await wmatic.balanceOf(wmaticVault.address)).toString()).to.equal(ZERO_BN.toString());
            
            const cptcValue = await cptc.balanceOf(wmaticVault.address);
            assert.isTrue(cptcValue.gt(ZERO_BN));
            const cptcWithdrawValue = ethers.BigNumber.from(cptcValue.toString());

            const beneficiary = accounts[0];
            const previousBalance = ethers.BigNumber.from((await cptc.balanceOf(beneficiary)).toString());
            
            const withdrawReceipt = await wmaticVault.withdrawTokens(beneficiary, { from: wealthyAddress });
            await expectEvent(withdrawReceipt, 'TokensWithdrawn');
            
            const afterBalance = ethers.BigNumber.from((await cptc.balanceOf(beneficiary)).toString());
            await expect(previousBalance.add(cptcWithdrawValue).toString()).to.equal(afterBalance.toString());
		});
	});

    describe('setHubAddress', () => {
        it('should not be able to change address because not owner', async () => {
            const newCptcHub = await CptcHub.new();
            await expectRevert(wmaticVault.setHubAddress(newCptcHub.address, { from: accounts[1] }), "Ownable: caller is not the owner");
        });

		it('should change the address of Hub to a new CptcHub', async () => {
			const newCptcHub = await CptcHub.new();
            const receipt = await wmaticVault.setHubAddress(newCptcHub.address, { from: wealthyAddress });
            await expectEvent(receipt, 'HubAddressModified');
		});
	});

});
