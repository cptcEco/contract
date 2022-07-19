// SPDX-License-Identifier: MIT
// todo update license
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CptcHub is Ownable{

    mapping(bytes32 => address) contractAddress;
    mapping(address => uint256) contractAuthorisationList; // 1 - allowed to mint, 2 - allowed to burn, 3 - allowed to mint and burn

    event ContractsChanged();

    function setContractAddress(string memory contractName, address newContractAddress, uint256 authorisation) external onlyOwner {
        bytes32 index = keccak256(abi.encodePacked(contractName));

        if(contractAddress[index] != address(0)) {
            address oldContractAddress = contractAddress[index];
            contractAuthorisationList[oldContractAddress] = 0;
        }
        contractAddress[index] = newContractAddress;

        if(newContractAddress != address(0)){
            contractAuthorisationList[newContractAddress] = authorisation;
        }

        emit ContractsChanged();
    }

    function getContractAddress(string memory contractName) external view returns(address) {
        bytes32 index = keccak256(abi.encodePacked(contractName));
        return contractAddress[index];
    }

    function getContractAuthorisation(address selectedContractAddress) external view returns (uint256) {
        return contractAuthorisationList[selectedContractAddress];
    }
}

