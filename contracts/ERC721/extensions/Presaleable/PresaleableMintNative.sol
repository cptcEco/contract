// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../Mintable/MintableWithNative.sol";
import "./BasePresaleable.sol";

abstract contract PresaleableMintNative is BasePresaleable, MintableWithNative {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, BasePresaleable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(BasePresaleable, ERC721) {
        BasePresaleable._beforeTokenTransfer(from, to, tokenId);
    }

    function preSaleMint(address recipient, uint amount)
        virtual
        public
        payable
        preSaleIsInProgress
        onlyWhitelisted(msg.sender)
    {
        require(preSalePrice.mul(amount) <= msg.value, "msg.value not enough");
        _preSaleMint(recipient, amount);
    }

    function _preSaleMint(address recipient, uint amount) internal override {
        _mintInternal(recipient, amount);
    }
}
