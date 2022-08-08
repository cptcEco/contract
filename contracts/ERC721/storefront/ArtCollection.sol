// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../extensions/Mintable/MintableWithERC20.sol";
import "../extensions/RoyaltyConfigurator.sol";
import "../extensions/Withdrawable.sol";

/// @custom:security-contact metaverse@culturalplaces.com
contract ExampleStorefrontArt is ERC721, MintableWithERC20, ERC721Enumerable, RoyaltyConfigurator {

    constructor(uint256 _price, address _defaultWithdrawAddress) 
    ERC721("Example Storefront Art", "ESA")
    MintableWithERC20(_price, 0x0a97853c72cB28C98B3112AE45215391675CAc43)
    Withdrawable(_defaultWithdrawAddress)
    {}

    function _baseURI() internal pure override returns (string memory) {
        return "http://localhost";
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, RoyaltyConfigurator) {
        ERC721Royalty._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, RoyaltyConfigurator)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function contractURI() public view returns (string memory) {
        return "https://metadata-url.com/my-metadata";
    }
}