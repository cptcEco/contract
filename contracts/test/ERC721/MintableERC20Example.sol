// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/Mintable/MintableWithERC20.sol";

contract MintableERC20Example is MintableWithERC20 {
    constructor(address _currencyToken)
        MintableWithERC20(1 ether, _currencyToken)
        Withdrawable(msg.sender)
        ERC721("MintableERC20Example", "MERC20")
    {}
}