// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../extensions/Mintable/MintableWithERC20.sol";
import "../extensions/RoyaltyConfigurator.sol";
import "../extensions/Withdrawable.sol";
import "../extensions/Redeemable.sol";

/// @custom:security-contact metaverse@culturalplaces.com
contract StorefrontRedeemable is ERC721, MintableWithERC20, ERC721Enumerable, RoyaltyConfigurator, Redeemable {
    using Strings for uint256;
    string private baseUri;
    string private contractUri;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _price,
        address _defaultWithdrawAddress,
        string memory _baseUri,
        string memory _contractUri,
        string memory _baseUriPostRedeem,
        address _erc20TokenAddress
    ) 
        ERC721(_name, _symbol)
        MintableWithERC20(_price, _erc20TokenAddress)
        Withdrawable(_defaultWithdrawAddress)
        Redeemable(_baseUriPostRedeem)
    {
        baseUri = _baseUri;
        contractUri = _contractUri;
    }

    function _baseURI() internal pure override(ERC721, Redeemable) returns (string memory) {
        return baseUri;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, RoyaltyConfigurator, ERC721URIStorage) {
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
        return contractUri;
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, Redeemable) returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");

        if (isRedeemed(tokenId)) {
            return string(abi.encodePacked(_redeemBaseURI(), tokenId.toString(), ".json"));
        }

        return string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
    }
}