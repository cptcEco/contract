// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract DroppableMerkle is Ownable, ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter internal _tokenIdCounter;
    // Contract may store more than one merkle root, each indexed to a groupId
    mapping(uint256 => bytes32) public merkleRoots;

    // This is a packed array of booleans.
    mapping(uint256 => mapping(uint256 => uint256)) private claimedBitMap;

    event RootSet(uint256 indexed groupId, bytes32 merkleRoot);
    event Claimed(uint256 indexed groupId, uint256 indexed index, address indexed account);

    function setGroupRoot(uint256 _groupId, bytes32 _merkleRoot) external onlyOwner {
      merkleRoots[_groupId] = _merkleRoot;
      emit RootSet(_groupId, _merkleRoot);
    }

    /**
     * @dev Checks if leaf airdrop was already claimed
     */
    function isClaimed(uint256 _groupId, uint256 _index) public view returns (bool) {
        uint256 claimedWordIndex = _index / 256;
        uint256 claimedBitIndex = _index % 256;
        uint256 claimedWord = claimedBitMap[_groupId][claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 _groupId, uint256 _index) private {
        uint256 claimedWordIndex = _index / 256;
        uint256 claimedBitIndex = _index % 256;
        claimedBitMap[_groupId][claimedWordIndex] = claimedBitMap[_groupId][claimedWordIndex] | (1 << claimedBitIndex);
    }

    function _claim(
        uint256 _groupId,
        uint256 _index,
        address _account,
        bytes32[] calldata _merkleProof
    ) internal {
        require(!isClaimed(_groupId, _index), "DroppableMerkle: Drop already claimed.");

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(_index, _account));
        require(
            MerkleProof.verify(_merkleProof, merkleRoots[_groupId], node),
            "DroppableMerkle: Invalid proof."
        );

        // Mark it claimed and send the _cptc.
        _setClaimed(_groupId, _index);
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_msgSender(), tokenId);

        emit Claimed(_groupId, _index, _account);
    }
}