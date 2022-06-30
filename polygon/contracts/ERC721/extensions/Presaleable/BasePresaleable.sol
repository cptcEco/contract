// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../Whitelistable.sol";

abstract contract BasePresaleable is Ownable, Whitelistable, ERC721Enumerable {
    bool internal preSaleInProgress;
    uint256 internal preSalePrice;
    constructor(uint256 _preSalePrice){
        preSalePrice = _preSalePrice;
    }

    modifier preSaleIsInProgress() {
        require(preSaleInProgress, "Pre-sale not in progress");
        _ ;
    }

    function setPreSalePrice(uint256 price) public onlyOwner {
        preSalePrice = price;
    }

    function getPreSalePrice() view public returns (uint256) {
        return preSalePrice;
    }

    function startPreSale() public onlyOwner {
        preSaleInProgress = true;
    }

    function endPreSale() public onlyOwner {
        preSaleInProgress = false;
    }

    function _preSaleMint(address recipient, uint amount) internal virtual;

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