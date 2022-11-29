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
contract StorefrontTicket is ERC721, MintableWithERC20, ERC721Enumerable, RoyaltyConfigurator, Redeemable {
    using Strings for uint256;
    string private baseUri;
    string private contractUri;

    struct TokenDetails { // Struct
        bool refunded;
        uint256 createdTimestamp;
    }
    //refund
    uint256 refundPeriod;
    uint256 refundFee;
    uint availableForWithdrawal = 0;
    mapping(uint256 => TokenDetails) private tokenIdTokenDetails;

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

    function _baseURI() internal view override(ERC721, Redeemable) returns (string memory) {
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

    function mint(uint256 count)
        virtual
        public 
        override 
    {
        super.mint(count);
        // add minted token information to tokenIdTokenDetails mapping
        tokenIdTokenDetails[Counters.current(_tokenIdCounter) - 1] = TokenDetails(false, block.number);
    }

    function refund(uint256 tokenId) public {
        // require i'm the owner
        require(ownerOf(tokenId) == msg.sender, "Sender is not owner of token");
        // require not redeemed
        require(!isRedeemed(tokenId), "Token redeemed");
        // require not refunded
        require(!tokenIdTokenDetails[tokenId].refunded, "Token already refunded");
        // refund period
        uint256 refundTimestamp = tokenIdTokenDetails[tokenId].createdTimestamp + refundPeriod;
        require(refundTimestamp >= block.number, "Refund period expired");
  
        // burn token
        _burn(tokenId);
        // send tokens back to the user :token price - fee
        IERC20(currencyToken).transferFrom(address(this), _msgSender(), price - refundFee);
        availableForWithdrawal += refundFee;
    }

    function setPrice(uint256 value) public override onlyOwner whenSaleNotInProgress {
        super.setPrice(value);
    }

    function setPrice(uint256 value, address token) public override onlyOwner whenSaleNotInProgress {
        super.setPrice(value, token);
    }

    function redeem(uint256 tokenId)
        public
        virtual
        override
        whenRedeemInProgress
        tokenNotRedeemed(tokenId)
    {
        super.redeem(tokenId);
        availableForWithdrawal += price;
    }

    function withdraw(address token) public virtual override {
        uint startBalance = IERC20(token).balanceOf(address(this));
        require(startBalance > 0, "Token balance is 0");
        require(availableForWithdrawal > 0, "Available for withdrawal is 0");
        address[] memory withdrawAddresses = super.getWithdrawAddresses();
        for (uint8 i = 0; i < withdrawAddresses.length; i++) {
            address withdrawAddress = withdrawAddresses[i];
            IERC20(token).transfer(withdrawAddress, availableForWithdrawal * withdrawAddressPercentages[withdrawAddress]/100);
        }

        if (defaultWithdrawAddress != address(0)) {
            uint afterBalance = IERC20(token).balanceOf(address(this));
            uint leftover = availableForWithdrawal - (startBalance - afterBalance);
            if (leftover != 0) {
                IERC20(token).transfer(defaultWithdrawAddress, leftover);
            }
        }
        availableForWithdrawal = 0;
        emit Withdraw(token);
    }

    function updateBaseUri(string memory _baseUri) external onlyOwner {
        baseUri = _baseUri;
    } 

    function updateContractUri(string memory _contractUri) external onlyOwner {
        contractUri = _contractUri;
    } 

}