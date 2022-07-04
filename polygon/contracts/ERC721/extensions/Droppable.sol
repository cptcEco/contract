// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Droppable is Ownable, ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter internal _tokenIdCounter;

    event Airdropped(address[] to);

    function airdrop(address[] calldata to) external onlyOwner {
        uint256 tokenId;
        for (uint i = 0; i < to.length; i++) {
            require(to[i] != address(0));
            tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to[i], tokenId);
        }

        emit Airdropped(to);
    }
}