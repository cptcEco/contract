const ethers = require('ethers');
const { expect } = require('chai');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const {
	takeSnapshot, 
	restoreSnapshot
} = require('./utils/helpers');
const constants = require('../constants.json');

const CollectionsRegistry = artifacts.require("CollectionsRegistry");

contract('CollectionsRegistry contract testing', async (accounts) => {
    const wealthyAddress = constants.liveWealthyAddress;

    let registry;
    let lastSnapshotId;
    before(async () => {
        registry = await CollectionsRegistry.new({ from: wealthyAddress });
        lastSnapshotId = await takeSnapshot(web3);
    });

    after(async () => {
        await restoreSnapshot(web3, lastSnapshotId);
    });
    describe('CollectionsRegistry general stuff', () => {

    });
});
