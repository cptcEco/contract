// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract CollectionsRegistry is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    EnumerableSet.Bytes32Set private categories;
    mapping(bytes32 => EnumerableSet.AddressSet) private categoryCollections;
    mapping(address => bytes32) private collectionCategory;

    event CategoryBulkAdded(bytes32[] categoryBulk);
    event CategoryAdded(bytes32 category);
    event CategoryRemoved(bytes32 category);
    event CollectionRegistered(bytes32 indexed category, address collection);
    event CollectionCategoryChanged(address indexed collection, bytes32 indexed oldCategory, bytes32 indexed newCategory);
    event CollectionUnregistered(address collection);

    function getCategory(uint index) external view returns (bytes32) {
        require(index < categories.length(), "Invalid index");
        return categories.at(index);
    }

    function getAllCategories() external view returns (bytes32[] memory) {
        return categories.values();
    }

    function getCollectionCategory(address collection) external view returns (bytes32) {
        return collectionCategory[collection];
    }

    function getAllCategoryCollections(bytes32 category) external view returns (address[] memory) {
        return categoryCollections[category].values();
    }

    function addCategories(bytes32[] calldata _categories) external onlyOwner {
        bytes32[] memory categoriesAdded;
        uint nextAddIndex = 0;

        for (uint i = 0; i < _categories.length; i++) {
            if(categories.add(_categories[i])) {
                // set will add just elements not already present
                categoriesAdded[nextAddIndex] = _categories[i];
                nextAddIndex += 1;
            }
        }

        emit CategoryBulkAdded(categoriesAdded);
    }
}