// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/Withdrawable.sol";

/// @dev This example overrides the `withdraw` function to withdraw
/// a specific token only to the default address
contract WithdrawableExample is Withdrawable {
    address public immutable withdrawTokenOnlyDefault;

    constructor(address _defaultWithdrawAddress, address _withdrawToken)
        Withdrawable(_defaultWithdrawAddress)
        ERC721("Withdrawable", "WTH")
    {
        withdrawTokenOnlyDefault = _withdrawToken;
    }

    function withdraw(address token) public override {
        if (token == withdrawTokenOnlyDefault) {
            // Should just withdraw to default address
            uint balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "Token balance is 0");
            IERC20(token).transfer(defaultWithdrawAddress, balance);
        } else {
            super.withdraw(token);
        }
    }
}