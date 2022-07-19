// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/Whitelistable.sol";

contract WhitelistableExample is Whitelistable {
    constructor() ERC721("WhitelistableExample", "WHL") {}
}