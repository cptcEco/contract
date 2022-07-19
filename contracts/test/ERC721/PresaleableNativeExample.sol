// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/Presaleable/PresaleableMintNative.sol";

contract PresaleableNativeExample is PresaleableMintNative {
    constructor()
        BasePresaleable(10_000_000 wei)
        MintableWithNative(1 ether)
        Withdrawable(msg.sender)
        ERC721("PresaleableNativeExample", "PSNAT")
    {}
}