// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CptcHub.sol";
import "./vaultConcerns/Airdrop.sol";
import "./vaultConcerns/Converter.sol";
import "./vaultConcerns/MerkleDistributor.sol";
import "./interfaces/IVault.sol";


contract Vault is IVault, Ownable, Initializable, Airdrop, Converter, MerkleDistributor {
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

    /**
     * @dev Vault initializer function.
     * This function can only be run once, and only by the factory (vault creator)
     */
    function initialize(
        address _owner,
        address _cptcHub,
        address _sushiRouter,
        address _paymentToken
    ) external onlyFactory initializer {
        hub = CptcHub(_cptcHub);
        transferOwnership(_owner);
        Converter._initialize(_sushiRouter, _paymentToken);
    }

    /**
     * @dev Transfers set amount of tokens to recipients. 
     * This is an expensive function to use for a large amount of recipients, so it should be
     * saved only for specific use cases where one wants to immediately transfer tokens to a 
     * small set of addresses.
     */
    function dropTokens(address[] calldata _recipients, uint256[] calldata _amounts) external override onlyOwner {
        Airdrop._dropTokens(hub.getContractAddress(TOKEN_HUB_IDENTIFIER), _recipients, _amounts);
    }

    /**
     * @dev Withdraws all funds from contract. Only its owner can use this.
     */
    function withdrawTokens(address _beneficiary) external onlyOwner override {
        IERC20 token = IERC20(hub.getContractAddress(TOKEN_HUB_IDENTIFIER));
        uint balance = token.balanceOf(address(this));
        
        require(token.transfer(_beneficiary, balance));
        emit TokensWithdrawn(_beneficiary, balance);
    }

    /**
     * @dev Claims airdrop
     */
    function claimAirdrop(
        uint256 _groupId,
        uint256 _index,
        address _account,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external override {
        MerkleDistributor._claim(
            hub.getContractAddress(TOKEN_HUB_IDENTIFIER),
            _groupId,
            _index,
            _account,
            _amount,
            _merkleProof
        );
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

    /**
     * @dev Destroys the Vault contract, transfering balance to owner (not token balances though).
     * It can only be called by the factory (vault creator)
     */
    function destroy() external onlyFactory {
        selfdestruct(payable(owner()));
    }
}

