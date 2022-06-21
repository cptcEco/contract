const { BigNumber, utils } = require('ethers')

const BalanceTree = require('./balanceTree')

const { isAddress, getAddress } = utils

const parseBalanceMap = (balances) => {
  // if balances are in an old format, process them
  const balancesInNewFormat = Array.isArray(balances)
    ? balances
    : Object.keys(balances).map((account) => {
        let earnings
        if (typeof balances[account] === 'number') {
          earnings = `0x${balances[account].toString(16)}`
        } else {
          earnings = BigNumber.from(balances[account]).toHexString()
        }

        return {
          address: account,
          earnings,
          reasons: '',
        }
      })

  const dataByAddress = balancesInNewFormat.reduce((memo, { address: account, earnings, reasons }) => {
    if (!isAddress(account)) {
      throw new Error(`Found invalid address: ${account}`)
    }
    const parsed = getAddress(account)
    if (memo[parsed]) {
      throw new Error(`Duplicate address: ${parsed}`)
    }
    const parsedNum = BigNumber.from(earnings)
    if (parsedNum.lte(0)) {
      throw new Error(`Invalid amount for account: ${account}`)
    }

    const flags = {
      isSOCKS: reasons.includes('socks'),
      isLP: reasons.includes('lp'),
      isUser: reasons.includes('user'),
    }

    memo[parsed] = { amount: parsedNum, ...(reasons === '' ? {} : { flags }) }
    return memo
  }, {})

  const sortedAddresses = Object.keys(dataByAddress).sort()

  // construct a tree
  const tree = new BalanceTree(
    sortedAddresses.map((address) => ({
      account: address,
      amount: dataByAddress[address].amount,
    }))
  )

  // generate claims
  const claims = sortedAddresses.reduce((memo, address, index) => {
    const { amount, flags } = dataByAddress[address]
    memo[address] = {
      index,
      amount: amount.toHexString(),
      proof: tree.getProof(index, address, amount),
      ...(flags ? { flags } : {}),
    }
    return memo
  }, {})

  const tokenTotal = sortedAddresses.reduce(
    (memo, key) => memo.add(dataByAddress[key].amount),
    BigNumber.from(0)
  )

  return {
    merkleRoot: tree.getHexRoot(),
    tokenTotal: tokenTotal.toHexString(),
    claims,
  }
}

module.exports = { parseBalanceMap };