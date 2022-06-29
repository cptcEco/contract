// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Mintable.sol";

abstract contract MintableWithNative is Mintable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    constructor(uint256 _price) {
        price = _price;
    }

    function setPrice(uint256 value) public override onlyOwner {
        price = value;
    }

    function mint(uint256 count)
        external
        payable
        whenSaleInProgress
        mintNumberRestricted(count)
        mintsPerWalletRestricted(_msgSender(), count)
    {
        require(price.mul(count) <= msg.value, "msg.value not enough");
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