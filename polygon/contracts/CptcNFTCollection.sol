//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721MetadataMintable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pauseable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Metadata.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CptcNFTCollection is ERC721Metadata, ERC721MetadataMintable, ERC721Pausable, Ownable {
    address payable private paymentReceivingAccount;

    using Counters for Counters.Counter;    
    Counters.Counter private _currentTokenId;

    uint256 private _collectionSize = 1000;

    mapping(address => bool) _whitelist;

    bool private _preSaleInProgress;

    uint256 private _preSaleTokenPrice = 222e18;

    uint256 private _preSaleLimitPerUser = 5;

    uint256 private _presaleTokenAmount = 1000;

    constructor(string memory _name, string memory _symbol) ERC721Metadata(_name, _symbol) {
        paymentReceivingAccount = payable(msg.sender);
    }

    function totalSupply() public {
        return _collectionSize;
    }

    /*
    @dev
    Sets the base uri and subsequent the token URIs.
    */
    function setBaseURI(string BaseURI) public onlyOwner {
        _setBaseURI(BaseURI);
        _setTokenURIs();
    }

    /*
    @dev
    Internal method to set token URIs of the collection. Required after
    BaseURI changed.
    */
    function _setTokenURIs() private {
        for (uint i=0; i<_currentTokenId; i++) {
            _setTokenURI(i, string(abi.encodePacked(Strings.toString(i), ".json")));
        } 
    }

    function setCollectionSize(uint256 collectionSize) public onlyOwner {
        _collectionSize = collectionSize;
    }

    function setPreSaleLimitPerUser(uint256 limit) public onlyOwner {
        _preSaleLimitPerUser = limit;
    }

    function setPreSalePrice(uint256 price) public onlyOwner {
        _preSaleTokenPrice = price;
    }

    function getPreSalePrice() public returns (uint256) {
        return _preSaleTokenPrice;
    }

    function setPreSaleTokenAmount(uint256 presaleTokenAmount) public onlyOwner {
        _presaleTokenAmount = presaleTokenAmount;
    }

    modifier presaleInProgress() {
        require(_preSaleInProgress, "CptcNFT: Pre-sale not in progress");
        _ ;
    }

    function startPresale() public onlyOwner {
        _preSaleInProgress = true;
    }

    function endPresale() public onlyOwner {
        _preSaleInProgress = false;
    }
    
    function whitelist(address _address) public onlyOwner {
        require(_address != address(0), "CptcNFT: whitelist for the zero address");
        _whitelist[_address] = true;
    }

    function whitelistBulk(address[] memory _addresses) public onlyOwner {
        for (uint i=0; i<_addresses.length; i++) {
            whitelist(_addresses[i]);
        }
    }

    function preSaleMint(address recipient, uint amount)
        public
        presaleInProgress
        payable
        returns (uint256)
    {
        // todo: figure wether recipient is blacklisted and also remove from whitelist after
        // one call to this funciton.
        require(msg.value >= (_preSaleTokenPrice * amount), "CptcNFT: not enough tokens sent. Check nft price!");
        require(amount <= _preSaleLimitPerUser, "CptcNFT: mint limit per user reached!");
        paymentReceivingAccount.transfer(msg.value);

        for (uint i=0; i<_addresses.length; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            _mint(recipient, newItemId);
            _setTokenURI(newItemId, string(abi.encodePacked(Strings.toString(newItemId), ".json")));
        }
    }

}