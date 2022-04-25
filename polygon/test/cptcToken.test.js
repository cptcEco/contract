const BN = require('bn.js');
const { assert } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');
const { signERC2612Permit } = require('eth-permit');
const { ethers } = require("ethers");

var CptcHub = artifacts.require('CptcHub');
var CptcToken = artifacts.require('CptcToken');
var hub;
var token;

async function sleepForMilliseconds(timeout) {
    await new Promise((resolve, reject) => {
        setTimeout(() => resolve(), timeout);
    });
}

async function updateBalances(when, owner, spender, recipient, tokenContract, web3, balances) {
    balances.owner.cptc[when] = (await tokenContract.balanceOf(owner)).toString();
    balances.owner.eth[when] =( await web3.eth.getBalance(owner)).toString();

    balances.spender.cptc[when] = (await token.balanceOf(spender)).toString();
    balances.spender.eth[when] = (await web3.eth.getBalance(spender)).toString();

    balances.recipient.cptc[when] = (await token.balanceOf(recipient)).toString();
    balances.recipient.eth[when] = (await web3.eth.getBalance(recipient)).toString();
}

contract('Token contract testing', async (accounts) => {
    beforeEach(async () => {
        // Get contracts used in hook
        hub = await CptcHub.deployed();
        token = await CptcToken.deployed();
    });

    it('Should have initial mint tokens', async () => {
        const initialMintRaw = await token.balanceOf(accounts[1]);

        assert.equal(initialMintRaw.toString(), '50000000000000000000000000', 'Initial mint value should be 50 mil tokens');
    });

    it('Total supply should be updated after initial mint, additional mint and burn. Expect success.', async () => {
        const initialMintAddress = accounts[1];
        const totalSupply = await token.totalSupply();
        const initialMintValue = '50000000000000000000000000';
        expect(totalSupply.toString()).to.equal(initialMintValue);
        assert.equal(totalSupply.toString(), '50000000000000000000000000', 'Initial mint value should be 50 mil tokens');

        const burnContractAddress = accounts[7];
        await hub.setContractAddress('burnContract', burnContractAddress, 2);
        await token.burn(initialMintAddress, initialMintValue, {from: burnContractAddress});

        const totalSupplyAfterBurn = await token.totalSupply();

        expect(totalSupplyAfterBurn.toNumber()).to.equal(0);

        const mintContractAddress = accounts[8];
        await hub.setContractAddress('mintContract', mintContractAddress, 1);

        const mintingValue = 100;
        await token.mint(initialMintAddress, mintingValue, {from: mintContractAddress});

        const totalSupplyAfterMint = await token.totalSupply();

        expect(totalSupplyAfterMint.toNumber()).to.equal(mintingValue);
    });

    it('Only owner is allowed to call set hub address', async () => {
        // account 0 is the owner
        await expectRevert(token.setHubAddress(accounts[2], { from: accounts[1] }), 'Ownable: caller is not the owner');
    });

    it('Wallet with right permission is allowed to call mint', async () => {
        await hub.setContractAddress('mintingContract', accounts[2], 1);
        await token.mint(accounts[3], 100, {from: accounts[2]});

        const balance = await token.balanceOf(accounts[3]);

        assert.equal(balance.toString(), '100', 'Expected balance is 100');
    });

    it('Wallet with bad permission is not allowed to call mint', async () => {
        await hub.setContractAddress('mintingContractBadPermission', accounts[4], 2);
        await expectRevert(token.mint(accounts[5], 100, {from: accounts[4]}), 'Bad authorisation rights for minting');

        const balance = await token.balanceOf(accounts[5]);

        assert.equal(balance.toString(), '0', 'Expected balance is 0');
    });

    it('Wallet with right permission is allowed to call burn', async () => {
        await hub.setContractAddress('mintContract', accounts[2], 1);
        await token.mint(accounts[6], 100, {from: accounts[2]});

        let balance = await token.balanceOf(accounts[6]);

        assert.equal(balance.toString(), '100', 'Expected balance is 100');

        await hub.setContractAddress('burnContract', accounts[7], 2);
        await token.burn(accounts[6], 100, {from: accounts[7]});

        balance = await token.balanceOf(accounts[6]);

        assert.equal(balance.toString(), '0', 'Expected balance is 0');
    });

    it('Wallet with bad permission is not allowed to call burn', async () => {
        await hub.setContractAddress('burnContractBadPermission', accounts[7], 1);
        await expectRevert(token.burn(accounts[6], 100, {from: accounts[7]}), 'Bad authorisation rights for burning');
    });

    it('Wallet with permission 3 is allowed to mint and burn', async () => {
        await hub.setContractAddress('mintBurnContract', accounts[8], 3);
        await token.mint(accounts[9], 100, {from: accounts[8]});
        await token.burn(accounts[9], 100, {from: accounts[8]});

        const balance = await token.balanceOf(accounts[9]);

        assert.equal(balance.toString(), '0', 'Expected balance is 0');
    });

    it('Transfer tokens using permit method. Expect valid values after transfer from.', async () => {
        const spender = accounts[2];
        const recipient = accounts[6];
        const mintingWallet = accounts[4];

        // Ganache Network ID Bug: https://github.com/trufflesuite/ganache-core/issues/515
        // Uncomment to see chain id, needs to be set manually with Ganache and be same
        // as network id due to issue above.
        // console.log("ChainID: " + await web3.eth.net.getId())

        // Configure the hub contract to know the permission contract.
        await hub.setContractAddress('permissionContract', mintingWallet, 1);

        // Init owner account:
        const ownerAccount = await web3.eth.accounts.create();
        const ownerPrivateKey = ownerAccount.privateKey
        // Initialize the owners Wallet provider for Ganache.
        const ownersWallet = new ethers.Wallet(
            ownerPrivateKey,
            new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545')
        );
        const owner = await ownersWallet.getAddress()

        // Mint tokens for the owner
        const transferValue = 100;
        await token.mint(owner, transferValue, { from: mintingWallet });
        const balances = {
            owner: {
                cptc: {},
                eth: {}
            },
            spender: {
                cptc: {},
                eth: {}
            },
            recipient: {
                cptc: {},
                eth: {}
            }
        }
        await updateBalances('before', owner, spender, recipient, token, web3, balances)

        // Define how long deadline is supposed to last. (120s)
        const deadline = Math.trunc((Date.now() + 120 * 1000) / 1000);

        const result = await signERC2612Permit(
            ownersWallet,
            token.address,
            owner,
            spender,
            transferValue,
            deadline
        );

        // Uncomment to see result of signing.
        // console.log(result);

        await token.permit(
            owner,
            spender,
            transferValue,
            result.deadline,
            result.v,
            result.r,
            result.s,
            { from: spender }
        );
        
        const allowance = await token.allowance(owner, spender);
        expect(allowance.toString()).to.equal(transferValue.toString());
        await token.transferFrom(owner, recipient, transferValue, { from: spender });
        
        const newAllowance = await token.allowance(owner, spender);
        expect(newAllowance.toString()).to.equal('0');

        await updateBalances('after', owner, spender, recipient, token, web3, balances);

        expect(balances.owner.cptc.before).to.equal(balances.recipient.cptc.after);
        expect(balances.owner.cptc.after).to.equal('0');
        expect(balances.owner.eth.before).to.equal(balances.owner.eth.after);
        expect(balances.spender.eth.before).to.not.equal(balances.spender.eth.after);
        expect(balances.spender.cptc.before).to.equal(balances.spender.cptc.after);

    });

    it('Call permit after deadline expired. Expect transaction to be reverted.', async () => {
        const spender = accounts[2];
        const recipient = accounts[6];
        const mintingWallet = accounts[4];

        // Ganache Network ID Bug: https://github.com/trufflesuite/ganache-core/issues/515
        // Uncomment to see chain id, needs to be set manually with Ganache and be same
        // as network id due to issue above.
        // console.log("ChainID: " + await web3.eth.net.getId())

        // Configure the hub contract to know the permission contract.
        await hub.setContractAddress('permissionContract', mintingWallet, 1);

        // Init owner account:
        const ownerAccount = await web3.eth.accounts.create();
        const ownerPrivateKey = ownerAccount.privateKey
        // Initialize the owners Wallet provider for Ganache.
        const ownersWallet = new ethers.Wallet(
            ownerPrivateKey,
            new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545')
        );
        const owner = await ownersWallet.getAddress()

        // Mint tokens for the owner
        const transferValue = 100;
        await token.mint(owner, transferValue, { from: mintingWallet });

        // Define how long deadline is supposed to last. (1s)
        const deadline = Math.trunc((Date.now() + 1 * 1000) / 1000);

        const result = await signERC2612Permit(
            ownersWallet,
            token.address,
            owner,
            spender,
            transferValue,
            deadline
        );

        // Uncomment to see result of signing.
        // console.log(result);
        
        // sleep for 2 sec, wait for deadline to pass
        await sleepForMilliseconds(2000);

        await expectRevert(token.permit(
            owner,
            spender,
            transferValue,
            result.deadline,
            result.v,
            result.r,
            result.s,
            { from: spender }
        ), 'expired deadline');
    });

    it('Call transfer from with more than allowed. Expect transaction to be reverted.', async () => {
        const spender = accounts[2];
        const recipient = accounts[6];
        const mintingWallet = accounts[4];

        // Ganache Network ID Bug: https://github.com/trufflesuite/ganache-core/issues/515
        // Uncomment to see chain id, needs to be set manually with Ganache and be same
        // as network id due to issue above.
        // console.log("ChainID: " + await web3.eth.net.getId())

        // Configure the hub contract to know the permission contract.
        await hub.setContractAddress('permissionContract', mintingWallet, 1);

        // Init owner account:
        const ownerAccount = await web3.eth.accounts.create();
        const ownerPrivateKey = ownerAccount.privateKey
        // Initialize the owners Wallet provider for Ganache.
        const ownersWallet = new ethers.Wallet(
            ownerPrivateKey,
            new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545')
        );
        const owner = await ownersWallet.getAddress()

        // Mint tokens for the owner
        const transferValue = 100;
        await token.mint(owner, transferValue, { from: mintingWallet });

        // Define how long deadline is supposed to last. (120s)
        const deadline = Math.trunc((Date.now() + 120 * 1000) / 1000);

        const result = await signERC2612Permit(
            ownersWallet,
            token.address,
            owner,
            spender,
            transferValue,
            deadline
        );

        // Uncomment to see result of signing.
        // console.log(result);

        await token.permit(
            owner,
            spender,
            transferValue,
            result.deadline,
            result.v,
            result.r,
            result.s,
            { from: spender }
        );
        
        const newTransferValue = transferValue + 1;

        await expectRevert(token.transferFrom(owner, recipient, newTransferValue, { from: spender }), 'insufficient allowance');
    });

    it('Getting balance of for account after minting. Expect account to have more tokens than before.', async () => {
        const mintingContractAddress = accounts[2];
        await hub.setContractAddress('mintingContract', mintingContractAddress, 1);
        const mintingValue = 100;
        const mintingAccount = accounts[3];
        const balanceBeforeMinting = await token.balanceOf(mintingAccount); 
        await token.mint(mintingAccount, mintingValue, {from: mintingContractAddress});
        const balanceAfterMinting = await token.balanceOf(mintingAccount);

        expect(balanceBeforeMinting.toNumber() + mintingValue).to.equal(balanceAfterMinting.toNumber());
    });

    it('I am able to transfer CPTC tokens between wallets. Expect success.', async () => {
        const mintingContractAddress = accounts[2];
        await hub.setContractAddress('mintingContract', mintingContractAddress, 1);
        const mintingValue = 100;
        const fromAccount = accounts[3];
        await token.mint(fromAccount, mintingValue, {from: mintingContractAddress});
        const toAccount = accounts[4];
        const balances = {
            from: {
            },
            to: {
            }
        };
        balances.from.before = (await token.balanceOf(fromAccount)).toNumber();
        balances.to.before = (await token.balanceOf(toAccount)).toNumber();
        const transferValue = 50;
        await token.transfer(toAccount, transferValue, {from: fromAccount});

        balances.from.after = (await token.balanceOf(fromAccount)).toNumber();
        balances.to.after = (await token.balanceOf(toAccount)).toNumber();

        expect(balances.from.before).to.equal(balances.from.after + transferValue);
        expect(balances.to.before).to.equal(balances.to.after - transferValue);
    });

    it('I am not able to transfer more than i own CPTC tokens between wallets. Expect transaction to be reverted.', async () => {
        const fromAccount = accounts[3];
        const fromAccoutnBalance = await token.balanceOf(fromAccount);
        const toAccount = accounts[4];
        const transferValue = fromAccoutnBalance.toNumber() + 1;
        await expectRevert(token.transfer(toAccount, transferValue, {from: fromAccount}), 'transfer amount exceeds balance');
    });

    it('Call permit method. Expect nonce for address should be incremented after successful transaction.', async () => {
        const spender = accounts[2];

        const mintingWallet = accounts[4];

        // Ganache Network ID Bug: https://github.com/trufflesuite/ganache-core/issues/515
        // Uncomment to see chain id, needs to be set manually with Ganache and be same
        // as network id due to issue above.
        // console.log("ChainID: " + await web3.eth.net.getId())

        // Configure the hub contract to know the permission contract.
        await hub.setContractAddress('permissionContract', mintingWallet, 1);

        // Init owner account:
        const ownerAccount = await web3.eth.accounts.create();
        const ownerPrivateKey = ownerAccount.privateKey
        // Initialize the owners Wallet provider for Ganache.
        const ownersWallet = new ethers.Wallet(
            ownerPrivateKey,
            new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545')
        );
        const owner = await ownersWallet.getAddress()

        // Mint tokens for the owner
        const transferValue = 100;

        await token.mint(owner, transferValue, { from: mintingWallet });
        // Define how long deadline is supposed to last. (120s)
        const deadline = Math.trunc((Date.now() + 120 * 1000) / 1000);
        const nonceBeforePermit = await token.nonces(owner);
        const result = await signERC2612Permit(
            ownersWallet,
            token.address,
            owner,
            spender,
            transferValue,
            deadline
        );

        // Uncomment to see result of signing.
        // console.log(result);

        await token.permit(
            owner,
            spender,
            transferValue,
            result.deadline,
            result.v,
            result.r,
            result.s,
            { from: spender }
        );
        const nonceAfterPermit = await token.nonces(owner);
        expect(nonceBeforePermit.toNumber()).to.equal(nonceAfterPermit.toNumber() - 1);
    });

    it('Call permit method with bad nonce. Expect transaction should be reverted.', async () => {
        const spender = accounts[2];

        const mintingWallet = accounts[4];

        // Ganache Network ID Bug: https://github.com/trufflesuite/ganache-core/issues/515
        // Uncomment to see chain id, needs to be set manually with Ganache and be same
        // as network id due to issue above.
        // console.log("ChainID: " + await web3.eth.net.getId())

        // Configure the hub contract to know the permission contract.
        await hub.setContractAddress('permissionContract', mintingWallet, 1);

        // Init owner account:
        const ownerAccount = await web3.eth.accounts.create();
        const ownerPrivateKey = ownerAccount.privateKey
        // Initialize the owners Wallet provider for Ganache.
        const ownersWallet = new ethers.Wallet(
            ownerPrivateKey,
            new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545')
        );
        const owner = await ownersWallet.getAddress()

        // Mint tokens for the owner
        const transferValue = 100;

        await token.mint(owner, transferValue, { from: mintingWallet });
        // Define how long deadline is supposed to last. (120s)
        const deadline = Math.trunc((Date.now() + 120 * 1000) / 1000);
        const nonceBeforePermit = await token.nonces(owner);
        const result = await signERC2612Permit(
            ownersWallet,
            token.address,
            owner,
            spender,
            transferValue,
            deadline,
            nonceBeforePermit.toNumber() + 1
        );

        // Uncomment to see result of signing.
        // console.log(result);
        await expectRevert(token.permit(
            owner,
            spender,
            transferValue,
            result.deadline,
            result.v,
            result.r,
            result.s,
            { from: spender }
        ), 'ERC20:Permit:INVALID_SIGNATURE');
    });
})