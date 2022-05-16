//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CptcNFT is ERC721URIStorage, Ownable {
    address payable private paymentReceivingAccount;

    using Counters for Counters.Counter;    
    Counters.Counter private _tokenIds;

    mapping(address => bool) _whitelist;

    bool private _presaleInProgress;

    uint256 private _tokenPrice = 222e18;

    uint256 private _mintLimitPerUser = 100;

    uint256 private _collectionSize = 1000;

    uint256 private _presaleTokenAmount = 1000;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        paymentReceivingAccount = payable(msg.sender);
    }

    modifier presaleInProgress() {
        require(_presaleInProgress, "CptcNFT: Pre-sale not in progress");
        _ ;
    }

    function startPresale() public onlyOwner {
        _presaleInProgress = true;
    }

    function endPresale() public onlyOwner {
        _presaleInProgress = false;
    }

    function setMintLimitPerUser(uint256 limit) public onlyOwner {
        _mintLimitPerUser = limit;
    }

    function setPrice(uint256 price) public onlyOwner {
        _tokenPrice = price;
    }

    function getPrice() public returns (uint256) {
        return _tokenPrice;
    }

    function setCollectionSize(uint256 collectionSize) public onlyOwner {
        _collectionSize = collectionSize;
    }

    function setPresaleTokenAmount(uint256 presaleTokenAmount) public onlyOwner {
        _presaleTokenAmount = presaleTokenAmount;
    }
    
    function whitelist(address _address) public onlyOwner {
        require(_address != address(0), "CptcNFT: whitelist for the zero address");
        _whitelist[_address] = true;
    }

    function whitelistMultiple(address[] memory _addresses) public onlyOwner {
        for (uint i=0; i<_addresses.length; i++) {
            whitelist(_addresses[i]);
        }
    }

    function mintPresaleNFT(address recipient, string memory tokenURI)
        public
        presaleInProgress
        payable
        returns (uint256)
    {
        require(msg.value >= _tokenPrice, "CptcNFT: not enough tokens sent. Check nft price!");
        require(balanceOf(msg.sender) >= _mintLimitPerUser, "CptcNFT: mint limit per user reached!");
        paymentReceivingAccount.transfer(msg.value);
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

}