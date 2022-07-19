// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/Redeemable.sol";

contract RedeemableExample is Redeemable {
    constructor() Redeemable("postRedeemUrl/") ERC721("RedeemableExample", "RED") {
        _mint(msg.sender, 1);
    }
}