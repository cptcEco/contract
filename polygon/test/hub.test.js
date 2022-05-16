const BN = require('bn.js');
const { assert } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

var CptcHub = artifacts.require('CptcHub');
var CptcToken = artifacts.require('CptcToken');

var hub;
var token;

contract.skip('Hub contract testing', async (accounts) => {
    before(async () => {
        // Get contracts used in hook
        hub = await CptcHub.deployed();
        token = await CptcToken.deployed();
    });

    it('Owner is allowed to call set contract address', async () => {
        await expectRevert(hub.setContractAddress('testContract', accounts[2], 2, { from: accounts[5] }), 'Ownable: caller is not the owner');
        const receipt = await hub.setContractAddress('testContract', accounts[2], 2, { from: accounts[0] });
        expectEvent(receipt, 'ContractsChanged');
    });

    it('Set contract address with permission 1', async () => {
        const contractName = `Test1Contract`;
        const authorisationCode = 1;

        await hub.setContractAddress(contractName, accounts[3], authorisationCode, { from: accounts[0] });

        const authorisation = await hub.getContractAuthorisation(accounts[3]);
        assert.equal(authorisation.toNumber(), authorisationCode, `Authorisation code expected to be ${authorisationCode}`);
    });

    it('Update contract permission from 1 to 2', async () => {
        const contractName = `ChangeContractPermission`;
        await hub.setContractAddress(contractName, accounts[3], 1, { from: accounts[0] });
        await hub.setContractAddress(contractName, accounts[3], 2, { from: accounts[0] });

        const authorisation = await hub.getContractAuthorisation(accounts[3]);
        assert.equal(authorisation.toNumber(), 2, 'Authorisation code expected to be 2');
    });

    it('Change contract address, old contract address have permission 0', async () => {
        const contractName = `ChangeContractAddress`;
        await hub.setContractAddress(contractName, accounts[3], 1, { from: accounts[0] });
        await hub.setContractAddress(contractName, accounts[4], 1, { from: accounts[0] });

        const authorisation = await hub.getContractAuthorisation(accounts[3]);
        assert.equal(authorisation.toNumber(), 0, 'Authorisation code expected to be 0');
    });
})