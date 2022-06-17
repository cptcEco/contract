// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVault {
    event TokensWithdrawn(address beneficiary, uint256 balance);
    event HubAddressModified(address newHubAddress);

    function initialize(address _owner, address _cptcHub, address _sushiRouter, address _paymentToken) external;

    function dropTokens(address[] calldata _recipients, uint256[] calldata _amounts) external;

    function assignTokens(address[] calldata _recipients, uint256[] calldata _amounts) external;

    function claimTokens(uint256 amount) external;

    function withdrawTokens(address _beneficiary) external;

    function convertERC20() external;

    function convertNativeCurrency() external;

    function setHubAddress(address newHubAddress) external;

    function destroy() external;
}