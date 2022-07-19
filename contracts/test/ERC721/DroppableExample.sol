// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/Droppable.sol";

contract DroppableExample is Droppable {
    constructor() ERC721("DroppableExamplle", "DROP") {}
}