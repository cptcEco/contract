const ethers = require('ethers');
const { assert } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { ecsign } = require('ethereumjs-util');

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
const StakingRewards = artifacts.require('StakingRewards');
const IUniswapV2ERC20 = artifacts.require('IUniswapV2ERC20');


contract('StakingRewards contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;
    const pairTokenAddress = constants.livePairTokenAddress;
    const rewardsTokenAddress = constants.liveTokenAddress
    const DAY = 86400;
    const ZERO_BN = ethers.BigNumber.from('0')

    let stakingRewards;
    let stakingToken;
    let rewardsToken;
    let lastSnapshotId;

    before(async () => {
        stakingRewards = await StakingRewards.deployed();
        stakingToken = await IUniswapV2ERC20.at(pairTokenAddress)
        rewardsToken = await IERC20.at(rewardsTokenAddress)
    });

    beforeEach(async () => {
        lastSnapshotId = await takeSnapshot(web3);
    });

    afterEach(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });

    describe('Constructor & Settings', async () => {
        it('should set rewards token on constructor', async () => {
			assert.equal(await stakingRewards.rewardsToken(), rewardsToken.address);
		});

		it('should set staking token on constructor', async () => {
			assert.equal(await stakingRewards.stakingToken(), stakingToken.address);
		});

        it('should set distribution address on constructor', async () => {
			assert.equal((await stakingRewards.rewardsDistribution()).toLowerCase(), wealthyAddress.toLowerCase());
		});
    })

    describe('Function permissions', () => {
		const rewardValue = toUnit(1.0);

		before(async () => {
			await rewardsToken.transfer(stakingRewards.address, rewardValue, { from: wealthyAddress });
		});

		it('only rewardsDistribution address can call notifyRewardAmount', async () => {
			await onlyGivenAddressCanInvoke({
				fnc: stakingRewards.notifyRewardAmount,
				args: [rewardValue, DAY],
				address: wealthyAddress,
				accounts,
                reason: 'Caller is not RewardsDistribution contract'
			});
		});
	});

	describe('lastTimeRewardApplicable()', () => {
        const rewardValue = toUnit(1.0);

		before(async () => {
			await rewardsToken.transfer(stakingRewards.address, rewardValue, { from: wealthyAddress });
		});

		describe('when updated', () => {
			it('should equal current timestamp', async () => {
				await stakingRewards.notifyRewardAmount(rewardValue, DAY, {
					from: wealthyAddress,
				});

				const cur = await currentTime(web3);
				const lastTimeReward = await stakingRewards.lastTimeRewardApplicable();
				assert.equal(lastTimeReward.toNumber(), cur);
			});
		});
	});

	describe('rewardPerToken()', () => {
        const stakingAccount1 = accounts[0]
		it('should be > 0', async () => {
			const totalToStake = toUnit('100');
			await stakingToken.transfer(stakingAccount1, totalToStake, { from: wealthyAddress });
			await stakingToken.approve(stakingRewards.address, totalToStake, { from: stakingAccount1 });
			await stakingRewards.stake(totalToStake, { from: stakingAccount1 });

			const totalSupply = await stakingRewards.totalSupply();
			assert.isTrue(totalSupply.gt(ZERO_BN));

			const rewardValue = toUnit(5000.0);
			await rewardsToken.transfer(stakingRewards.address, rewardValue, { from: wealthyAddress });
			await stakingRewards.notifyRewardAmount(rewardValue, DAY, {
				from: wealthyAddress,
			});

			await fastForward(web3, DAY);

			const rewardPerToken = await stakingRewards.rewardPerToken();
			assert.isTrue(rewardPerToken.gt(ZERO_BN));
		});
	});

	describe('stake()', () => {
        const stakingAccount1 = accounts[1]
		it('staking increases staking balance', async () => {
			const totalToStake = toUnit('100');
			await stakingToken.transfer(stakingAccount1, totalToStake, { from: wealthyAddress });
			await stakingToken.approve(stakingRewards.address, totalToStake, { from: stakingAccount1 });

			const initialStakeBal = await stakingRewards.balanceOf(stakingAccount1);
			const initialLpBal = await stakingToken.balanceOf(stakingAccount1);

			await stakingRewards.stake(totalToStake, { from: stakingAccount1 });

			const postStakeBal = await stakingRewards.balanceOf(stakingAccount1);
			const postLpBal = await stakingToken.balanceOf(stakingAccount1);

			assert.isTrue(postLpBal.lt(initialLpBal));
			assert.isTrue(postStakeBal.gt(initialStakeBal));
		});

		it('cannot stake 0', async () => {
			await expectRevert(stakingRewards.stake('0'), 'Cannot stake 0');
		});
	});

	describe('stakeWithPermit()', () => {
		it('should work using sign', async () => {
			const totalToStake = expandTo18Decimals(2);

			const ownerPrivateKey = '0x02b39cac1532bef9dba3e36ec32d3de1e9a88f1dda597d3ac6e2130aed9adc4e'
			const ownerAddress = accounts[0]

			await stakingToken.transfer(ownerAddress, totalToStake, { from: wealthyAddress });

			const initialStakeBal = await stakingRewards.balanceOf(ownerAddress);
			const initialLpBal = await stakingToken.balanceOf(ownerAddress);

			// get permit
			const nonce = (await stakingToken.nonces(ownerAddress)).toNumber()
			const deadline = ethers.constants.MaxUint256
			const digest = await getApprovalDigest(
			  stakingToken,
			  { owner: ownerAddress, spender: stakingRewards.address, value: totalToStake },
			  nonce,
			  deadline,
			  await web3.eth.net.getId()
			)
			
			const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(ownerPrivateKey.slice(2), 'hex'))

	        const receipt = await stakingRewards.stakeWithPermit(
				totalToStake,
	            deadline,
	            v,
	            r,
	            s,
	            { from: ownerAddress }
	        );
			await expectEvent(receipt, 'Staked');

			const postStakeBal = await stakingRewards.balanceOf(ownerAddress);
			const postLpBal = await stakingToken.balanceOf(ownerAddress);

			assert.isTrue(postLpBal.lt(initialLpBal));
			assert.isTrue(postStakeBal.gt(initialStakeBal));
		});

		it('cannot stake 0', async () => {
			await expectRevert(stakingRewards.stake('0'), 'Cannot stake 0');
		});
	});

	describe('earned()', () => {
        const stakingAccount1 = accounts[2]
        const stakingAccount2 = accounts[3]
		it('should be 0 when not staking', async () => {
            const earned = await stakingRewards.earned(stakingAccount1)
			assert.equal(earned.toString(), '0');
		});

		it('should be > 0 when staking', async () => {
			const totalToStake = toUnit('100');
			await stakingToken.transfer(stakingAccount1, totalToStake, { from: wealthyAddress });
			await stakingToken.approve(stakingRewards.address, totalToStake, { from: stakingAccount1 });
			await stakingRewards.stake(totalToStake, { from: stakingAccount1 });

			const rewardValue = toUnit(5000.0);
			await rewardsToken.transfer(stakingRewards.address, rewardValue, { from: wealthyAddress });
			await stakingRewards.notifyRewardAmount(rewardValue, DAY, {
				from: wealthyAddress,
			});

			await fastForward(web3, DAY);

			const earned = await stakingRewards.earned(stakingAccount1);

			assert.isTrue(earned.gt(ZERO_BN));
		});

		it('rewardRate should increase if new rewards come before DURATION ends', async () => {
			const totalToDistribute = toUnit('5000');

			await rewardsToken.transfer(stakingRewards.address, totalToDistribute, { from: wealthyAddress });
			await stakingRewards.notifyRewardAmount(totalToDistribute, DAY, {
				from: wealthyAddress,
			});

			const rewardRateInitial = await stakingRewards.rewardRate();

			await rewardsToken.transfer(stakingRewards.address, totalToDistribute, { from: wealthyAddress });
			await stakingRewards.notifyRewardAmount(totalToDistribute, DAY, {
				from: wealthyAddress,
			});

			const rewardRateLater = await stakingRewards.rewardRate();

			assert.isTrue(rewardRateInitial.gt(ZERO_BN));
			assert.isTrue(rewardRateLater.gt(rewardRateInitial));
		});

		it('rewards token balance should rollover after DURATION', async () => {
			const totalToStake = toUnit('100');
			const totalToDistribute = toUnit('5000');

			await stakingToken.transfer(stakingAccount2, totalToStake, { from: wealthyAddress });
			await stakingToken.approve(stakingRewards.address, totalToStake, { from: stakingAccount2 });
			await stakingRewards.stake(totalToStake, { from: stakingAccount2 });

			await rewardsToken.transfer(stakingRewards.address, totalToDistribute, { from: wealthyAddress });
			await stakingRewards.notifyRewardAmount(totalToDistribute, DAY, {
				from: wealthyAddress,
			});

			await fastForward(web3, DAY * 7);
			const earnedFirst = await stakingRewards.earned(stakingAccount2);

			await rewardsToken.transfer(stakingRewards.address, totalToDistribute, { from: wealthyAddress });
			await stakingRewards.notifyRewardAmount(totalToDistribute, DAY, {
				from: wealthyAddress,
			});

			await fastForward(web3, DAY * 7);
			const earnedSecond = await stakingRewards.earned(stakingAccount2);

			assert.isTrue(earnedSecond.eq(earnedFirst.add(earnedFirst)));
		});
	});

	describe('getReward()', () => {
        const stakingAccount1 = accounts[4]
		it('should increase rewards token balance', async () => {
			const totalToStake = toUnit('100');
			const totalToDistribute = toUnit('5000');

			await stakingToken.transfer(stakingAccount1, totalToStake, { from: wealthyAddress });
			await stakingToken.approve(stakingRewards.address, totalToStake, { from: stakingAccount1 });
			await stakingRewards.stake(totalToStake, { from: stakingAccount1 });

			await rewardsToken.transfer(stakingRewards.address, totalToDistribute, { from: wealthyAddress });
			await stakingRewards.notifyRewardAmount(totalToDistribute, DAY, {
				from: wealthyAddress,
			});

			await fastForward(web3, DAY);

			const initialRewardBal = await rewardsToken.balanceOf(stakingAccount1);
			const initialEarnedBal = await stakingRewards.earned(stakingAccount1);
			await stakingRewards.getReward({ from: stakingAccount1 });
			const postRewardBal = await rewardsToken.balanceOf(stakingAccount1);
			const postEarnedBal = await stakingRewards.earned(stakingAccount1);

			assert.isTrue(postEarnedBal.lt(initialEarnedBal));
			assert.isTrue(postRewardBal.gt(initialRewardBal));
		});
	});

    describe('withdraw()', () => {
        const stakingAccount1 = accounts[0]
		it('cannot withdraw if nothing staked', async () => {
			await expectRevert(stakingRewards.withdraw(toUnit('100')), 'Panic: Arithmetic overflow.');
		});

		it('should increases lp token balance and decreases staking balance', async () => {
			const totalToStake = toUnit('100');
			await stakingToken.transfer(stakingAccount1, totalToStake, { from: wealthyAddress });
			await stakingToken.approve(stakingRewards.address, totalToStake, { from: stakingAccount1 });
			await stakingRewards.stake(totalToStake, { from: stakingAccount1 });

			const initialStakingTokenBal = await stakingToken.balanceOf(stakingAccount1);
			const initialStakeBal = await stakingRewards.balanceOf(stakingAccount1);

			assert.equal(totalToStake.toString(), initialStakeBal.toString());
			assert.equal(initialStakingTokenBal.toString(), '0')

			await stakingRewards.withdraw(totalToStake, { from: stakingAccount1 });

			const postStakingTokenBal = await stakingToken.balanceOf(stakingAccount1);
			const postStakeBal = await stakingRewards.balanceOf(stakingAccount1);

            assert.equal(postStakeBal.toString(), '0')
			assert.equal(postStakingTokenBal.toString(), initialStakeBal.toString())
		});

		it('cannot withdraw 0', async () => {
			await expectRevert(stakingRewards.withdraw('0'), 'Cannot withdraw 0');
		});
	});

	describe('exit()', () => {
        const stakingAccount1 = accounts[0]
		it('should retrieve all earned and increase rewards bal', async () => {
			const totalToStake = toUnit('100');
			const totalToDistribute = toUnit('5000');

			await stakingToken.transfer(stakingAccount1, totalToStake, { from: wealthyAddress });
			await stakingToken.approve(stakingRewards.address, totalToStake, { from: stakingAccount1 });
			await stakingRewards.stake(totalToStake, { from: stakingAccount1 });

			await rewardsToken.transfer(stakingRewards.address, totalToDistribute, { from: wealthyAddress });
			await stakingRewards.notifyRewardAmount(toUnit(5000.0), DAY, {
				from: wealthyAddress,
			});

			await fastForward(web3, DAY);

			const initialRewardBal = await rewardsToken.balanceOf(stakingAccount1);
			const initialEarnedBal = await stakingRewards.earned(stakingAccount1);
			await stakingRewards.exit({ from: stakingAccount1 });
			const postRewardBal = await rewardsToken.balanceOf(stakingAccount1);
			const postEarnedBal = await stakingRewards.earned(stakingAccount1);

			assert.isTrue(postEarnedBal.lt(initialEarnedBal));
			assert.isTrue(postRewardBal.gt(initialRewardBal));
			assert.equal(postEarnedBal.toString(), '0');
		});
	});

	describe('notifyRewardAmount()', () => {
		it('Reverts if the provided reward is greater than the balance.', async () => {
			const rewardValue = toUnit(1000);
			await rewardsToken.transfer(stakingRewards.address, rewardValue, { from: wealthyAddress });
			await expectRevert(
				stakingRewards.notifyRewardAmount(rewardValue.add(toUnit(10)), DAY, {
					from: wealthyAddress,
				}),
				'Provided reward too high'
			);
		});

		it('Reverts if the provided reward is greater than the balance, plus rolled-over balance.', async () => {
			const rewardValue = toUnit(1000);
			await rewardsToken.transfer(stakingRewards.address, rewardValue, { from: wealthyAddress });
			stakingRewards.notifyRewardAmount(rewardValue, DAY, {
				from: wealthyAddress,
			});
			await rewardsToken.transfer(stakingRewards.address, rewardValue, { from: wealthyAddress });
			// Now take into account any leftover quantity.
			await expectRevert(
				stakingRewards.notifyRewardAmount(rewardValue.add(toUnit(10)), DAY, {
					from: wealthyAddress,
				}),
				'Provided reward too high'
			);
		});
	});
})