// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVault {
    event HubAddressModified(address newHubAddress);

    function dropTokens(address[] memory _recipients, uint256[] memory _amounts) external;

    function withdrawTokens(address _beneficiary) external;

    function convertERC20() external;

    function convertNativeCurrency() external;

    function setHubAddress(address newHubAddress) external;
}