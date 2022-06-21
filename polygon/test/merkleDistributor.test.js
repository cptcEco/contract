const chai = require('chai');
const { solidity } = require('ethereum-waffle');
const { BigNumber, constants } = require('ethers')

const {
	takeSnapshot, 
	restoreSnapshot
} = require('./utils/helpers');
const BalanceTree = require('./utils/merkle/balanceTree')
const { parseBalanceMap } = require('./utils/merkle/parseBalanceMap')
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const constantAddresses = require('../constants.json');

const expect = chai.expect;

const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol");
const CptcHub = artifacts.require('CptcHub');
const IUniswapV2Router02 = artifacts.require('IUniswapV2Router02');
const Vault = artifacts.require('Vault');

chai.use(solidity)

const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

contract('MerkleDistributor', (accounts) => {
    const wealthyAddress = constantAddresses.liveWealthyAddress;
    const ZERO_BN = BigNumber.from('0')

    let cptcHub;
    let vault;
    let sushiRouter;
    let usdc;
    let cptc;
    let lastSnapshotId;

    before(async () => {
        cptcHub = await CptcHub.deployed();
        sushiRouter = await IUniswapV2Router02.at(constantAddresses.liveSushiRouter);
        usdc = await IERC20.at(constantAddresses.liveUSDC);
        cptc = await IERC20.at(constantAddresses.liveTokenAddress);

        vault = await Vault.new({ from: wealthyAddress });
        await vault.initialize(wealthyAddress, cptcHub.address, sushiRouter.address, usdc.address, { from: wealthyAddress });
    });

    beforeEach(async () => {
        lastSnapshotId = await takeSnapshot(web3);
    });

    afterEach(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });

    describe('#merkleRoots', () => {
      it('returns the zero merkle root', async () => {
        expect(await vault.merkleRoots(0)).to.eq(ZERO_BYTES32)
      })
    })

  describe('#claim', () => {
    it('fails for empty proof', async () => {
      await expectRevert(
        vault.claimAirdrop(0, 0, accounts[0], 10, []),
        'MerkleDistributor: Invalid proof.'
      )
    })

    describe('two account tree', () => {
      let insideSnapshot
      const tree = new BalanceTree([
        { account: accounts[0], amount: BigNumber.from(100) },
        { account: accounts[1], amount: BigNumber.from(101) },
      ])
      beforeEach('deploy', async () => {
        await vault.setGroupRoot(0, tree.getHexRoot(), { from: wealthyAddress })
        insideSnapshot = await takeSnapshot(web3);
      })

      afterEach(async () => {
        await restoreSnapshot(web3, insideSnapshot);
      });

      it('successful claim', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        const proof0 = tree.getProof(0, accounts[0], BigNumber.from(100))
        const receipt0 = await vault.claimAirdrop(0, 0, accounts[0], 100, proof0)
        await expectEvent(receipt0, 'Claimed')
        
        const proof1 = tree.getProof(1, accounts[1], BigNumber.from(101))
        const receipt1 = await vault.claimAirdrop(0, 1, accounts[1], 101, proof1)
        await expectEvent(receipt1, 'Claimed')
      })

      it('transfers the token', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        const proof0 = tree.getProof(0, accounts[0], BigNumber.from(100))
        await expect((await cptc.balanceOf(accounts[0])).toString()).to.equal(ZERO_BN.toString());
        await vault.claimAirdrop(0, 0, accounts[0], 100, proof0)
        expect((await cptc.balanceOf(accounts[0])).toString()).to.eq('100')
      })

      it('must have enough to transfer', async () => {
        const proof0 = tree.getProof(0, accounts[0], BigNumber.from(100))
        await cptc.transfer(vault.address, 99, { from: wealthyAddress });
        
        await expectRevert(
          vault.claimAirdrop(0, 0, accounts[0], 100, proof0), 
          'ERC20: transfer amount exceeds balance'
        )
      })

      it('sets #isClaimed', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        
        const proof0 = tree.getProof(0, accounts[0], BigNumber.from(100))
        expect(await vault.isClaimed(0, 0)).to.eq(false)
        expect(await vault.isClaimed(0, 1)).to.eq(false)
        await vault.claimAirdrop(0, 0, accounts[0], 100, proof0)
        expect(await vault.isClaimed(0, 0)).to.eq(true)
        expect(await vault.isClaimed(0, 1)).to.eq(false)
      })

      it('cannot allow two claims', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        const proof0 = tree.getProof(0, accounts[0], BigNumber.from(100))
        await vault.claimAirdrop(0, 0, accounts[0], 100, proof0)
        await expectRevert(
          vault.claimAirdrop(0, 0, accounts[0], 100, proof0), 
          'MerkleDistributor: Drop already claimed.'
        )
      })

      it('cannot claim more than once: 0 and then 1', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        await vault.claimAirdrop(
          0,
          0,
          accounts[0],
          100,
          tree.getProof(0, accounts[0], BigNumber.from(100))
        )
        await vault.claimAirdrop(
          0,
          1,
          accounts[1],
          101,
          tree.getProof(1, accounts[1], BigNumber.from(101))
        )

        await expectRevert(
          vault.claimAirdrop(
            0,
            0,
            accounts[0],
            100,
            tree.getProof(0, accounts[0], BigNumber.from(100))
          ),
          'MerkleDistributor: Drop already claimed.'
        )
      })

      it('cannot claim more than once: 1 and then 0', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        await vault.claimAirdrop(
          0,
          1,
          accounts[1],
          101,
          tree.getProof(1, accounts[1], BigNumber.from(101))
        )
        await vault.claimAirdrop(
          0,
          0,
          accounts[0],
          100,
          tree.getProof(0, accounts[0], BigNumber.from(100))
        )

        await expectRevert(
          vault.claimAirdrop(
            0,
            1,
            accounts[1],
            101,
            tree.getProof(1, accounts[1], BigNumber.from(101))
          ),
          'MerkleDistributor: Drop already claimed.'
        )
      })

      it('cannot claim for address other than proof', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        const proof0 = tree.getProof(0, accounts[0], BigNumber.from(100))
        await expectRevert(
          vault.claimAirdrop(0, 1, accounts[1], 101, proof0),
          'MerkleDistributor: Invalid proof.'
        )
      })

      it('cannot claim more than proof', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        const proof0 = tree.getProof(0, accounts[0], BigNumber.from(100))
        await expectRevert(
          vault.claimAirdrop(0, 0, accounts[0], 101, proof0),
          'MerkleDistributor: Invalid proof.'
        )
      })
    })
    describe('larger tree', () => {
      const tree = new BalanceTree(
        accounts.map((wallet, ix) => {
          return { account: wallet, amount: BigNumber.from(ix + 1) }
        })
      )
      beforeEach('deploy', async () => {
        await cptc.transfer(vault.address, 201, { from: wealthyAddress });
        
        await vault.setGroupRoot(0, tree.getHexRoot(), { from: wealthyAddress })
      })

      it('claim index 4', async () => {
        const proof = tree.getProof(4, accounts[4], BigNumber.from(5))
        const receipt = await vault.claimAirdrop(0, 4, accounts[4], 5, proof)
        
        await expectEvent(receipt, 'Claimed')
      })

      it('claim index 9', async () => {
        const proof = tree.getProof(9, accounts[9], BigNumber.from(10))
        const receipt = await vault.claimAirdrop(0, 9, accounts[9], 10, proof)
        await expectEvent(receipt, 'Claimed')
      })
    })

    describe('realistic size tree', async () => {
      let tree
      const NUM_LEAVES = 100_000
      const NUM_SAMPLES = 25
      const elements = []

      before(async () => {
        for (let i = 0; i < NUM_LEAVES; i++) {
          const node = { account: accounts[0], amount: BigNumber.from(100) }
          elements.push(node)
        }
        tree = new BalanceTree(elements)
        await vault.setGroupRoot(0, tree.getHexRoot(), { from: wealthyAddress })
      })

      it('proof verification works', () => {
        const root = Buffer.from(tree.getHexRoot().slice(2), 'hex')
        for (let i = 0; i < NUM_LEAVES; i += NUM_LEAVES / NUM_SAMPLES) {
          const proof = tree
            .getProof(i, accounts[0], BigNumber.from(100))
            .map((el) => Buffer.from(el.slice(2), 'hex'))
          const validProof = BalanceTree.verifyProof(
            i,
            accounts[0],
            BigNumber.from(100),
            proof,
            root
          )
          expect(validProof).to.be.true
        }
      })

      beforeEach('deploy', async () => {
        await cptc.transfer(vault.address, 1000000, { from: wealthyAddress });
        
      })

      it('no double claims in random distribution', async () => {
        for (
          let i = 0;
          i < 25;
          i += Math.floor(Math.random() * (NUM_LEAVES / NUM_SAMPLES))
        ) {
          const proof = tree.getProof(i, accounts[0], BigNumber.from(100))
          await vault.claimAirdrop(0, i, accounts[0], 100, proof)
          await expectRevert(
            vault.claimAirdrop(0, 0, accounts[0], 100, proof),
            'MerkleDistributor: Drop already claimed.'
          )
        }
      })
    })
  })

  describe('parseBalanceMap', () => {
    let claims
    beforeEach('deploy', async () => {
      const {
        claims: innerClaims,
        merkleRoot,
        tokenTotal,
      } = parseBalanceMap({
        [accounts[0]]: 200,
        [accounts[1]]: '300', // add a string one to verify that the hex cast works
        [accounts[2]]: 250,
      })
      expect(tokenTotal).to.eq('0x02ee') // 750
      claims = innerClaims
      await vault.setGroupRoot(0, merkleRoot, { from: wealthyAddress })
      await cptc.transfer(vault.address, tokenTotal, { from: wealthyAddress });
    })

    it('all claims work exactly once', async () => {
      for (const account of Object.keys(claims)) {
        const claim = claims[account]
        const receipt = await vault.claimAirdrop(
            0,
            claim.index,
            account,
            claim.amount,
            claim.proof
          )
        await expectEvent(receipt, 'Claimed')

        await expectRevert(
          vault.claimAirdrop(
            0,
            claim.index,
            account,
            claim.amount,
            claim.proof
          ),
          'MerkleDistributor: Drop already claimed.'
        )
      }
      await expect((await cptc.balanceOf(vault.address)).toString()).to.equal(ZERO_BN.toString());
    })
  })
})