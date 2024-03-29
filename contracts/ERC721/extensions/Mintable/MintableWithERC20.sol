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

    function setPrice(uint256 value) virtual public override onlyOwner {
        price = value;
    }

    function setPrice(uint256 value, address token) virtual public onlyOwner {
        currencyToken = token;
        setPrice(value);
    }

    function mint(uint256 count)
        virtual
        public 
        whenSaleInProgress
        mintNumberRestricted(count)
        mintsPerWalletRestricted(_msgSender(), count)
    {
        uint256 amountAvailable = IERC20(currencyToken).allowance(_msgSender(), address(this));
        uint256 fullPrice = price.mul(count);
        require(amountAvailable >= fullPrice, "Contract is not allowed to spend fullPrice");

        bool success = IERC20(currencyToken).transferFrom(_msgSender(), address(this), fullPrice);
        require(success, "Was not able to transfer funds");
        _mintInternal(count);
    }

    function _mintInternal(uint256 count) internal override {
        _mintInternal(_msgSender(), count);
    }

    function _mintInternal(address recipient, uint256 count) internal {
        uint256 tokenId;
        for (uint i = 0; i < count; i++) {
            tokenId = _tokenIdCounter.current();  
            _tokenIdCounter.increment();       
            _safeMint(recipient, tokenId);
        }
    }
}