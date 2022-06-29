// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVault {
    event TokensWithdrawn(address beneficiary, uint256 balance);
    event HubAddressModified(address newHubAddress);

    function dropTokens(address[] calldata _recipients, uint256[] calldata _amounts) external;

    function claimAirdrop(
        uint256 _groupId,
        uint256 _index,
        address _account,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external;

    function withdrawTokens(address _beneficiary) external;

    function convertERC20() external;

    function convertNativeCurrency() external;

    function setHubAddress(address newHubAddress) external;
}