const ethers = require('ethers')


const expandTo18Decimals = (n) => {
    return ethers.BigNumber.from(n).mul(ethers.BigNumber.from(10).pow(18));
}

const toUnit = (v) => ethers.utils.parseUnits(v.toString());

const PERMIT_TYPEHASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

const getDomainSeparator = (name, tokenAddress, chainId) => {
    return ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [
                ethers.utils.keccak256(
                  ethers.utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
                ),
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)),
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes('1')),
                chainId,
                tokenAddress,
            ]
        )
    )
}

const getApprovalDigest = async (
    token,
    approve,
    nonce,
    deadline,
    chainId
) => {
    const name = await token.name()
    const DOMAIN_SEPARATOR = getDomainSeparator(name, token.address, chainId)
    return ethers.utils.keccak256(
        ethers.utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
                '0x19',
                '0x01',
                DOMAIN_SEPARATOR,
                ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                      ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                      [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
                    )
                ),
            ]
        )
    )
}


module.exports = { toUnit, getApprovalDigest, expandTo18Decimals }