// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../Withdrawable.sol";

abstract contract Mintable is Ownable, Withdrawable {
    using Counters for Counters.Counter;

    uint256 public price;
    uint256 public maxPerMint = 40;
    uint256 public maxMintsPerWallet = 100;

    mapping(address => uint256) public mintsPerWallet;

    bool private _saleInProgress = false;
    Counters.Counter internal _tokenIdCounter;

    event SaleStopped(address account);
    event SaleStarted(address account);

    modifier whenSaleInProgress() {
        require(saleInProgress(), "Sale not in progress");
        _;
    }

    modifier whenSaleNotInProgress() {
        require(!saleInProgress(), "Sale in progress");
        _;
    }

    modifier mintNumberRestricted(uint256 count) {
        require(count <= maxPerMint, "maxPerMint exceeded");
        _;
    }

    modifier mintsPerWalletRestricted(address wallet, uint256 newMints) {
        require(
            mintsPerWallet[wallet] + newMints <= maxMintsPerWallet,
            "maxMintsPerWallet would be exceeded"
        );
        _;
    }

    function saleInProgress() public view returns (bool) {
        return _saleInProgress;
    }

    function startSale() external whenSaleNotInProgress onlyOwner {
        _saleInProgress = true;
        emit SaleStarted(_msgSender());
    }

    function stopSale() external whenSaleInProgress onlyOwner {
        _saleInProgress = false;
        emit SaleStopped(_msgSender());
    }

    function setMaxPerMint(uint256 value) external onlyOwner {
        maxPerMint = value;
    }

    function setMaxMintPerWallet(uint256 value) external onlyOwner {
        maxMintsPerWallet = value;
    }

    function setPrice(uint256 value) public virtual;

    function _mintInternal(uint256 count) internal virtual;
}