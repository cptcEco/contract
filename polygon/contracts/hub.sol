pragma solidity ^0.8.5;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Hub is Ownable{

    mapping(bytes32 => address) contractAddress;
    mapping(address => uint256) contractAuthorisationList; // 1 - allowed to mint, 2 - allowed to burn, 3 - allowed to mint and burn

    event ContractsChanged();

    function setContractAddress(string contractName, address newContractAddress,uint256 authorisation)
    public onlyOwner {
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

    function getContractAddress(string contractName)  public view returns(address selectedContractAddress) {
        bytes32 index = keccak256(abi.encodePacked(contractName));
        return contractAddress[index];
    }

    function getContractAuthorisation(address selectedContractAddress) public view returns (uint256) {
        return contractAuthorisationList[selectedContractAddress];
    }
}

