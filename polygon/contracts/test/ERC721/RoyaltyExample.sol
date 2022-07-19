// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/RoyaltyConfigurator.sol";

contract RoyaltyExample is RoyaltyConfigurator {
    constructor(address _defaultWithdrawAddress)
        Withdrawable(_defaultWithdrawAddress)
        ERC721("RoyaltyExamplle", "ROY")
    {}
}