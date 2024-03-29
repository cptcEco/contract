// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Redeemable is Ownable, ERC721URIStorage {
    using Strings for uint256;

    mapping(uint256 => bool) private redeemed;

    bool private _redeemInProgress = false;
    string private _redeemedBaseURI;

    event RedeemStopped(address indexed account);
    event RedeemStarted(address indexed account);
    event Redeemed(address indexed account, uint256 tokenId);

    modifier whenRedeemInProgress() {
        require(redeemInProgress(), "Redeem not in progress");
        _;
    }

    modifier whenRedeemNotInProgress() {
        require(!redeemInProgress(), "Redeem in progress");
        _;
    }

    modifier tokenNotRedeemed(uint256 tokenId) {
        require(!redeemed[tokenId], "Token already redeemed");
        _;
    }

    constructor(string memory _baseUriPostRedeem) {
        _redeemedBaseURI = _baseUriPostRedeem;
    }

    /**
     * @dev BaseURI pre-redeeming, should be overriden 
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return "";
    }

    function _redeemBaseURI() public view returns (string memory) {
        return _redeemedBaseURI;
    }

    function redeemInProgress() public view returns (bool) {
        return _redeemInProgress;
    }

    function startRedeem() external whenRedeemNotInProgress onlyOwner {
        _redeemInProgress = true;
        emit RedeemStarted(_msgSender());
    }

    function stopRedeem() external whenRedeemInProgress onlyOwner {
        _redeemInProgress = false;
        emit RedeemStopped(_msgSender());
    }

    function isRedeemable(uint256 tokenId) external view returns (bool) {
        return !redeemed[tokenId];
    }

    function isRedeemed(uint256 tokenId) public view returns (bool) {
        return redeemed[tokenId];
    }

    function redeem(uint256 tokenId)
        public
        virtual
        whenRedeemInProgress
        tokenNotRedeemed(tokenId)
    {
        require(ownerOf(tokenId) == _msgSender(), "Not owner of token");
        redeemed[tokenId] = true;
        emit Redeemed(_msgSender(), tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");

        if (redeemed[tokenId]) {
            return string(abi.encodePacked(_redeemBaseURI(), tokenId.toString()));
        }

        return super.tokenURI(tokenId);
    }

    function updateRedeemedBaseURI (string memory _baseUriPostRedeem) external onlyOwner {
        _redeemedBaseURI = _baseUriPostRedeem;
    }
}