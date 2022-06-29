// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Mintable.sol";

abstract contract MintableWithERC20 is Mintable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    address public currencyToken;

    constructor(uint256 _price, address _currencyToken) {
        price = _price;
        currencyToken = _currencyToken;
    }

    function setPrice(uint256 value) public override onlyOwner {
        price = value;
    }

    function setPrice(uint256 value, address token) public onlyOwner {
        currencyToken = token;
        setPrice(value);
    }

    function mint(uint256 count, uint256 tokenAmount) 
        external 
        whenSaleInProgress
        mintNumberRestricted(count)
        mintsPerWalletRestricted(_msgSender(), count)
    {
        uint256 amountAvailable = IERC20(currencyToken).allowance(_msgSender(), address(this));
        require(tokenAmount >= amountAvailable, "Contract is not allowed to spent tokenAmount");
        require(price.mul(count) <= tokenAmount, "tokenAmount not enough");

        _mintInternal(count);
    }

    function _mintInternal(uint256 count) internal override {
        uint256 tokenId;
        for (uint i = 0; i < count; i++) {
            tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(_msgSender(), tokenId);
        }
    }
}