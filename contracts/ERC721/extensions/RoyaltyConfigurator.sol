// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Withdrawable.sol";

abstract contract RoyaltyConfigurator is Ownable, Withdrawable, ERC721Royalty {
    function setTokenRoyalty(
        uint256 tokenId,
        uint96 feeNumerator
    ) external onlyOwner {
        _setTokenRoyalty(tokenId, address(this), feeNumerator);
    }
    
    function setDefaultRoyalty(uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(address(this), feeNumerator);
    }

    function getDefaultRoyalty() external view returns (address receiver, uint256 royaltyFraction) {
        (receiver, royaltyFraction) = ERC721Royalty(address(this)).royaltyInfo(type(uint).max, _feeDenominator());  // The way to get default royalty
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721Royalty) {
        ERC721Royalty._burn(tokenId);
    }
}