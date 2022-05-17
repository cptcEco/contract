//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CptcNFTCollection is ERC721URIStorage, Ownable {
    address payable private paymentReceivingAccount;

    using Counters for Counters.Counter;    
    Counters.Counter private _currentTokenId;

    uint256 private _collectionSize = 1000;

    mapping(address => bool) _whitelist;

    bool private _preSaleInProgress;

    uint256 private _preSaleTokenPrice = 222e18;

    uint256 private _preSaleLimitPerUser = 5;

    uint256 private _presaleTokenAmount = 1000;

    string private _baseUri;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        paymentReceivingAccount = payable(msg.sender);
    }

    function totalSupply() view public returns (uint256) {
        return _collectionSize;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseUri = baseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseUri;
    }

    function setCollectionSize(uint256 collectionSize) public onlyOwner {
        _collectionSize = collectionSize;
    }

    function setPresaleLimitPerUser(uint256 limit) public onlyOwner {
        _preSaleLimitPerUser = limit;
    }

    function setPresalePrice(uint256 price) public onlyOwner {
        _preSaleTokenPrice = price;
    }

    function getPresalePrice() view public returns (uint256) {
        return _preSaleTokenPrice;
    }

    function setPresaleTokenAmount(uint256 presaleTokenAmount) public onlyOwner {
        _presaleTokenAmount = presaleTokenAmount;
    }

    modifier presaleInProgress() {
        require(_preSaleInProgress, "CptcNFTCollection: Pre-sale not in progress");
        _ ;
    }

    modifier onlyWhitelisted(address _address) {
        require(_whitelist[_address], "CptcNFTCollection: only whitelisted accounts allowed!");
        _ ;
    }

    function startPresale() public onlyOwner {
        _preSaleInProgress = true;
    }

    function endPresale() public onlyOwner {
        _preSaleInProgress = false;
    }
    
    function whitelist(address _address) public onlyOwner {
        require(_address != address(0), "CptcNFTCollection: whitelist for the zero address");
        _whitelist[_address] = true;
    }

    function _removeFromWhitelist(address _address) private {
        require(_address != address(0), "CptcNFTCollection: remove from whitelist for the zero address");
        _whitelist[_address] = false;
    }

    function whitelistBulk(address[] calldata _addresses) public onlyOwner {
        for (uint i=0; i<_addresses.length; i++) {
            whitelist(_addresses[i]);
        }
    }

    function preSaleMint(address recipient, uint amount)
        public
        onlyWhitelisted(msg.sender)
        presaleInProgress
        payable
    {
        require(msg.value >= (_preSaleTokenPrice * amount), "CptcNFTCollection: not enough tokens sent. Check nft price!");
        require(amount <= _preSaleLimitPerUser, "CptcNFTCollection: mint limit per user reached!");
        require(_currentTokenId.current() + amount < _collectionSize, "CptcNFTCollection: not enough tokens left for minting!");

        paymentReceivingAccount.transfer(msg.value);

        for (uint i=0; i<amount; i++) {
            _currentTokenId.increment();
            uint256 newItemId = _currentTokenId.current();
            _mint(recipient, newItemId);
            _setTokenURI(newItemId, string(abi.encodePacked(Strings.toString(newItemId), ".json")));
        }
        _removeFromWhitelist(msg.sender);
    }
}