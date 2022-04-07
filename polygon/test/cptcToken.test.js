const BN = require('bn.js');
const { assert } = require('chai');
const { expectRevert } = require('@openzeppelin/test-helpers');

var CptcHub = artifacts.require('CptcHub');
var CptcToken = artifacts.require('CptcToken');

var hub;
var token;

contract('Token contract testing', async (accounts) => {
    before(async () => {
        // Get contracts used in hook
        hub = await CptcHub.deployed();
        token = await CptcToken.deployed();
    });

    it('Should have initial mint tokens', async () => {
        const initialMintRaw = await token.balanceOf(accounts[1]);

        assert.equal(initialMintRaw.toString(), '50000000000000000000000000', 'Initial mint value should be 50 mil tokens');
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
        expectRevert(token.burn(accounts[6], 100, {from: accounts[7]}), 'Bad authorisation rights for burning');
    });

    it('Wallet with permission 3 is allowed to mint and burn', async () => {
        await hub.setContractAddress('mintBurnContract', accounts[8], 3);
        await token.mint(accounts[9], 100, {from: accounts[8]});
        await token.burn(accounts[9], 100, {from: accounts[8]});

        const balance = await token.balanceOf(accounts[9]);

        assert.equal(balance.toString(), '0', 'Expected balance is 0');
    });
})