// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/Mintable/MintableWithNative.sol";

contract MintableNativeExample is MintableWithNative {
    constructor()
        MintableWithNative(1 ether)
        Withdrawable(msg.sender)
        ERC721("MintableNativeExample", "MNAT")
    {}
}