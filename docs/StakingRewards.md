# Staking Rewards Contract
The StakingRewards contract is used to stake a given amount of sushi liquidity pool tokens (SLP, corresponding to CPTC-WMATIC pool) to earn rewards in CPTC. This provides utility to the CPTC token and incentivizes liquidity.

## Requirements
One must pass the hub contract address as a parameter. The hub will have the SLP and CPTC token addresses in its directory.


### Functionalities 
When a user provides liquidity to the sushi pool, it will receive SLP tokens corresponding to their share in the pool (and increasing value through trading fees). The user can then stake those SLP tokens into the StakingRewards contract through two different methods:

1. `stake(uint256 amount)` - a user gives the StakingRewards contract approval to transfer their SLP balance, and then calls this function to stake the given amount in the contract.
2. `stakeWithPermit(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` - because the SLP token is an ERC20-permit token (follows EIP-2612), user can create an offchain signature and use it to directly stake tokens without having to call the `approve` method on the SLP token first.

User can claim their current rewards (`getReward()`), withdraw a given amount of their staked funds (`withdraw(uint256 amount)`) or entirely exit the StakingRewards contract, removing all their staked funds and unclaimed rewards at once (`exit()`).

The StakingRewards' contract balance is the source of the CPTC rewards distributed to the stakers. This means that someone must top up this balance for stakers to get rewards. This is the top up flow:
1. CPTC distributor (RewardsDistribution address stored in the hub directory) transfers tokens to the StakingRewards contract.
2. Distributor calls `notifyRewardAmount(uint256 reward, uint256 rewardsDuration)`. This will set the new amount of tokens available to distribute, and the duration of the distribution. Through these values, the reward distribution rate is also calculated.