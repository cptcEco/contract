const BN = require('bn.js');
const { expectRevert } = require('@openzeppelin/test-helpers');
const ethers = require('ethers')


const toUnit = v => ethers.utils.parseUnits(v.toString());

const send = (web3, payload) => {
	if (!payload.jsonrpc) payload.jsonrpc = '2.0';
	if (!payload.id) payload.id = new Date().getTime();

	return new Promise((resolve, reject) => {
		web3.currentProvider.send(payload, (error, result) => {
			if (error) return reject(error);

			return resolve(result);
		});
	});
};

/**
 *  Mines a single block in Ganache (evm_mine is non-standard)
 */
const mineBlock = (web3) => send(web3, { method: 'evm_mine' });

/**
 *  Gets the time of the last block.
 */
const currentTime = async (web3) => {
	const { timestamp } = await web3.eth.getBlock('latest');
	return timestamp;
};

/**
 *  Increases the time in the EVM.
 *  @param seconds Number of seconds to increase the time by
 */
 const fastForward = async (web3, seconds) => {
	// It's handy to be able to be able to pass big numbers in as we can just
	// query them from the contract, then send them back. If not changed to
	// a number, this causes much larger fast forwards than expected without error.
	if (BN.isBN(seconds)) seconds = seconds.toNumber();

	// And same with strings.
	if (typeof seconds === 'string') seconds = parseFloat(seconds);

	await send(web3, {
		method: 'evm_increaseTime',
		params: [seconds],
	});

	await mineBlock(web3);
};


async function onlyGivenAddressCanInvoke({
    fnc,
    args,
    accounts,
    address = undefined,
    reason = undefined,
    skipPassCheck = false
}) {
    for (const user of accounts) {
        if (user.toLowerCase() === address.toLowerCase()) {
            continue;
        }

        await expectRevert(fnc(...args, { from: user }), reason ? reason : expectRevert.unspecified);
    }
    if (!skipPassCheck && address) {
        await fnc(...args, { from: address });
    }
}

const restoreSnapshot = async (web3, id) => {
    await send(web3, {
        method: 'evm_revert',
        params: [id],
    });
    await mineBlock(web3);
};

const takeSnapshot = async (web3) => {
    const { result } = await send(web3, { method: 'evm_snapshot' });
    await mineBlock(web3);

    return result;
};

module.exports = { toUnit, fastForward, onlyGivenAddressCanInvoke, currentTime, takeSnapshot, restoreSnapshot }
