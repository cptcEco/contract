// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./CptcHub.sol";
import "./Vault.sol";
import "./interfaces/IVault.sol";

contract VaultFactory is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    address public cptcHub;
    address immutable public sushiRouter;

    EnumerableSet.AddressSet private owners;
    mapping(address => EnumerableSet.AddressSet) ownerToVaults;
    mapping(address => address) vaultToCollection;
    mapping(address => address) collectionToVault;

    event HubAddressModified(address newHubAddress);
    event VaultCreated(address indexed owner, address vault, address collection, address paymentToken);
    event VaultDeleted(address indexed owner, address vault, address collection);

    modifier onlyVaultOwner(address vault) {
        require(ownerToVaults[msg.sender].contains(vault), "Caller is not the vault owner");
        _;
    }

    constructor(address _cptcHub, address _sushiRouter) {
        cptcHub = _cptcHub;
        sushiRouter = _sushiRouter;
    }

    function setHubAddress(address newHubAddress) external onlyOwner {
        cptcHub = newHubAddress;
        emit HubAddressModified(newHubAddress);
    }

    /**
     * @dev Creates a new vault contract using opcode create2.
     * The vault should be linked to the address of an nft collection.
     * Msg.sender becomes the owner of the vault.
     */
    function createVault(address collection, address paymentToken) external returns (address vault) {
        require(collectionToVault[collection] == address(0), "Collection already has vault");
        
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, cptcHub, sushiRouter, paymentToken));
        vault = Create2.deploy(0, salt, type(Vault).creationCode);
        
        IVault(vault).initialize(msg.sender, cptcHub, sushiRouter, paymentToken);

        owners.add(msg.sender);
        ownerToVaults[msg.sender].add(vault);
        vaultToCollection[vault] = collection;
        collectionToVault[collection] = vault;

        emit VaultCreated(msg.sender, vault, collection, paymentToken);
    }

    /**
     * @dev Deletes vault code. Only the owner can call this function, and the selfdestruct of the vault
     * can only be called by this factory, through this method.
     */
    function deleteVault(address vault) external onlyVaultOwner(vault) {
        ownerToVaults[msg.sender].remove(vault);
        address collection = vaultToCollection[vault];
        delete collectionToVault[collection];
        delete vaultToCollection[vault];

        if (ownerToVaults[msg.sender].length() == 0) {
            owners.remove(msg.sender);
        }

        IVault(vault).destroy();
        
        emit VaultDeleted(msg.sender, vault, collection);
    }

    function getCollectionVault(address collection) external view returns (address) {
        return collectionToVault[collection];
    }

    function getVaultCollection(address vault) external view returns (address) {
        return vaultToCollection[vault];
    }

    function getOwners() external view returns (address[] memory) {
        return owners.values();
    }

    function getOwnerVaults(address owner) external view returns (address[] memory) {
        return ownerToVaults[owner].values();
    }

    /**
     * @dev Gets two lists, one with the owner's vault addresses and the other with
     * the corresponding collection addresses. This means getVaultCollection(vaults[0]) == collections[0]
     */
    function getOwnerVaultCollectionPairs(address owner) external view returns (address[] memory, address[] memory) {
        address[] memory vaults = ownerToVaults[owner].values();
        uint256 length = vaults.length;
        
        address[] memory collections = new address[](length);
        for (uint256 i = 0; i < vaults.length; i++) {
            collections[i] = vaultToCollection[vaults[i]];
        }

        return (vaults, collections);
    }
}