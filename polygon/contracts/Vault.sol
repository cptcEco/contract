// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CptcHub.sol";
import "./vaultConcerns/Airdrop.sol";
import "./vaultConcerns/Converter.sol";
import "./interfaces/IVault.sol";


contract Vault is IVault, Ownable, Airdrop, Converter {
    CptcHub public hub;
    string constant private TOKEN_HUB_IDENTIFIER = "TokenContract";

    constructor(
        address _owner,
        address _cptcHub,
        address _sushiRouter,
        address _paymentToken
    ) 
        Converter(_sushiRouter, _paymentToken)
    {
        hub = CptcHub(_cptcHub);
        transferOwnership(_owner);
    }

    function dropTokens(address[] memory _recipients, uint256[] memory _amounts) external override onlyOwner {
        Airdrop._dropTokens(hub.getContractAddress(TOKEN_HUB_IDENTIFIER), _recipients, _amounts);
    }

    function withdrawTokens(address _beneficiary) external onlyOwner override {
        Airdrop._withdrawTokens(hub.getContractAddress(TOKEN_HUB_IDENTIFIER), _beneficiary);
    }

    function convertERC20() external override {
        Converter._convertERC20(hub.getContractAddress(TOKEN_HUB_IDENTIFIER));
    }

    function convertNativeCurrency() external override {
        Converter._convertNativeCurrency(hub.getContractAddress(TOKEN_HUB_IDENTIFIER));
    }

    function setHubAddress(address newHubAddress) external override onlyOwner {
        hub = CptcHub(newHubAddress);
        emit HubAddressModified(newHubAddress);
    }
}

