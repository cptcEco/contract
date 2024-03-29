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
contract StorefrontMedia is ERC721, MintableWithERC20, ERC721Enumerable, RoyaltyConfigurator {
    string private baseUri;
    string private contractUri;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _price,
        address _defaultWithdrawAddress,
        string memory _baseUri,
        string memory _contractUri,
        address _erc20TokenAddress
    ) 
        ERC721(_name, _symbol)
        MintableWithERC20(_price, _erc20TokenAddress)
        Withdrawable(_defaultWithdrawAddress)
    {
        baseUri = _baseUri;
        contractUri = _contractUri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
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
        return contractUri;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "StorefrontMedia: URI query for nonexistent token");
        return tokenURI();
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI() public view virtual returns (string memory) {
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? baseURI : "";
    }

    function updateBaseUri(string memory _baseUri) external onlyOwner {
        baseUri = _baseUri;
    } 

    function updateContractUri(string memory _contractUri) external onlyOwner {
        contractUri = _contractUri;
    } 
}