const BN = require('bn.js');
const { assert } = require('chai');

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

    });

    it('Wallet with right permission is allowed to call mint', async () => {

    });

    it('Wallet with bad permission is not allowed to call mint', async () => {

    });

    it('Wallet with right permission is allowed to call burn', async () => {

    });

    it('Wallet with bad permission is not allowed to call burn', async () => {

    });
})