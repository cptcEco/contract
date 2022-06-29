// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Whitelistable.sol";

abstract contract Presaleable is Ownable, Whitelistable, ERC721Enumerable {
    bool private preSaleInProgress;
    uint256 private preSaleTokenPrice;
    uint256 private preSaleLimitPerUser;
    uint256 private preSaleTokenAmount;
    constructor (
        uint256 _preSaleTokenPrice,
        uint256 _preSaleLimitPerUser,
        uint256 _preSaleTokenAmount
    ){
        preSaleTokenPrice = _preSaleTokenPrice;
        preSaleLimitPerUser = _preSaleLimitPerUser;
        preSaleTokenAmount = _preSaleTokenAmount;
    }

    modifier preSaleIsInProgress() {
        require(preSaleInProgress, "Pre-sale not in progress");
        _ ;
    }

    function setPreSaleLimitPerUser(uint256 limit) public onlyOwner {
        preSaleLimitPerUser = limit;
    }

    function setPreSalePrice(uint256 price) public onlyOwner {
        preSaleTokenPrice = price;
    }

    function getPreSalePrice() view public returns (uint256) {
        return preSaleTokenPrice;
    }

    function setPreSaleTokenAmount(uint256 amount) public onlyOwner {
        preSaleTokenAmount = amount;
    }

    function startPreSale() public onlyOwner {
        preSaleInProgress = true;
    }

    function endPreSale() public onlyOwner {
        preSaleInProgress = false;
    }

    function preSaleMint(address recipient, uint amount) public payable virtual;

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        ERC721Enumerable._beforeTokenTransfer(from, to, tokenId);
    }
}