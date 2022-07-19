// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleDistributor is Ownable {
    // Contract may store more than one merkle root, each indexed to a groupId
    mapping(uint256 => bytes32) public merkleRoots;

    // This is a packed array of booleans.
    mapping(uint256 => mapping(uint256 => uint256)) private claimedBitMap;

    event RootSet(uint256 indexed groupId, bytes32 merkleRoot);
    event Claimed(uint256 indexed groupId, uint256 indexed index, address account, uint256 amount);

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
        address _cptc,
        uint256 _groupId,
        uint256 _index,
        address _account,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) internal {
        require(!isClaimed(_groupId, _index), "MerkleDistributor: Drop already claimed.");

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(_index, _account, _amount));
        require(
            MerkleProof.verify(_merkleProof, merkleRoots[_groupId], node),
            "MerkleDistributor: Invalid proof."
        );

        // Mark it claimed and send the _cptc.
        _setClaimed(_groupId, _index);
        require(IERC20(_cptc).transfer(_account, _amount), "MerkleDistributor: Transfer failed.");

        emit Claimed(_groupId, _index, _account, _amount);
    }
}