//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract WhitelistableMerkle is ERC721 {
    bytes32 public merkleRoot;
    uint256 public nextTokenId;
    mapping(address => bool) public claimed;

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    function mint(bytes32[] calldata merkleProof) public payable {
        require(claimed[msg.sender] == false, "already claimed");
        claimed[msg.sender] = true;
        require(MerkleProof.verify(merkleProof, merkleRoot, keccak256(abi.encodePacked(msg.sender))), "invalid merkle proof");
        nextTokenId++;
        _mint(msg.sender, nextTokenId);
    }
}