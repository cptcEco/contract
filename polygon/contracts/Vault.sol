// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CptcHub.sol";
import "./vaultConcerns/Airdrop.sol";
import "./vaultConcerns/Converter.sol";
import "./interfaces/IVault.sol";


contract Vault is IVault, Ownable, Initializable, Airdrop, Converter {
    CptcHub public hub;
    string constant private TOKEN_HUB_IDENTIFIER = "TokenContract";
    address immutable public factory;

    modifier onlyFactory() {
        require(factory == _msgSender(), "Caller is not the factory");
        _;
    }

    constructor() {
        factory = msg.sender;
    }

    function initialize(
        address _owner,
        address _cptcHub,
        address _sushiRouter,
        address _paymentToken
    ) external onlyFactory initializer override {
        hub = CptcHub(_cptcHub);
        transferOwnership(_owner);
        Converter.initialize(_sushiRouter, _paymentToken);
    }

    /**
     * @dev Transfers set amount of tokens to recipients
     */
    function dropTokens(address[] calldata _recipients, uint256[] calldata _amounts) external override onlyOwner {
        Airdrop._dropTokens(hub.getContractAddress(TOKEN_HUB_IDENTIFIER), _recipients, _amounts);
    }

    function assignTokens(address[] calldata _recipients, uint256[] calldata _amounts) external override onlyOwner {
        Airdrop._assignTokens(_recipients, _amounts);
    }

    function claimTokens(uint256 amount) external override {
        Airdrop._claimTokens(hub.getContractAddress(TOKEN_HUB_IDENTIFIER), amount);
    }

    /**
     * @dev Withdraws all funds from contract
     */
    function withdrawTokens(address _beneficiary) external onlyOwner override {
        IERC20 token = IERC20(hub.getContractAddress(TOKEN_HUB_IDENTIFIER));
        uint balance = token.balanceOf(address(this));
        
        require(token.transfer(_beneficiary, balance));
        emit TokensWithdrawn(_beneficiary, balance);
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

    function destroy() external override onlyFactory {
        selfdestruct(payable(owner()));
    }
}

