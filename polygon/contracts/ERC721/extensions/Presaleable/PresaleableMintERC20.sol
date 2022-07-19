// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../Mintable/MintableWithERC20.sol";
import "./BasePresaleable.sol";

abstract contract PresaleableMintERC20 is BasePresaleable, MintableWithERC20 {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(RoyaltyConfigurator, BasePresaleable)
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

    function _burn(uint256 tokenId) internal virtual override(ERC721, RoyaltyConfigurator) {
        RoyaltyConfigurator._burn(tokenId);
    }

    function preSaleMint(address recipient, uint amount)
        virtual
        public
        preSaleIsInProgress
        onlyWhitelisted(msg.sender)
    {
        uint256 amountAvailable = IERC20(currencyToken).allowance(_msgSender(), address(this));
        uint256 fullPrice = preSalePrice.mul(amount);
        require(fullPrice <= amountAvailable, "Contract is not allowed to spend fullPrice");

        bool success = IERC20(currencyToken).transferFrom(_msgSender(), address(this), fullPrice);
        require(success, "Was not able to transfer funds");
        _preSaleMint(recipient, amount);
    }

    function _preSaleMint(address recipient, uint amount) internal override {
        _mintInternal(recipient, amount);
    }
}