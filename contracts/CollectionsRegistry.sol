// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MarketeerManagement.sol";
import "./CptcHub.sol";

contract CollectionsRegistry is MarketeerManagement {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    string constant private TOKEN_HUB_IDENTIFIER = "TokenContract";

    EnumerableSet.Bytes32Set private categories;
    mapping(bytes32 => EnumerableSet.AddressSet) private categoryCollections;
    mapping(address => bytes32) private collectionCategory;

    uint public registrationFee;
    CptcHub public hub;

    ////////////////////////////////////////
    //////////////// EVENTS ////////////////
    ////////////////////////////////////////

    event HubAddressModified(address newHubAddress);
    event Withdrawal(address indexed admin, uint amount);
    event RegistrationFeeChanged(uint newValue);
    event CategoryBulkAdded(bytes32[] categoryBulk);
    event CategoryAdded(bytes32 indexed category);
    event CategoryRemoved(bytes32 indexed category);
    event CollectionRegistered(bytes32 indexed category, address collection);
    event CollectionCategoryChanged(address indexed collection, bytes32 indexed oldCategory, bytes32 indexed newCategory);
    event CollectionUnregistered(address indexed collection, bytes32 indexed category);

    //////////////////////////////////////
    ///////////// MODIFIERS //////////////
    //////////////////////////////////////

    modifier validCollection(address _collection) {
        require(_collection != address(0), "Address 0");
        _;
    }

    modifier validCategory(bytes32 _category) {
        require(_category != "", "Empty category");
        _;
    }

    modifier categoryExists(bytes32 _category) {
        require(categories.contains(_category), "Category inexistent");
        _;
    }

    ///////////////////////////////////////
    ///////////// CONSTRUCTOR /////////////
    ///////////////////////////////////////
    constructor(address _admin, address _ctpcHub) MarketeerManagement(_admin) {
        hub = CptcHub(_ctpcHub);
    }

    ///////////////////////////////////////
    //////////////// VIEWS ////////////////
    ///////////////////////////////////////

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

    //////////////////////////////////////////
    ///////////// STATE CHANGERS /////////////
    //////////////////////////////////////////

    function setHubAddress(address newHubAddress) external onlyAdmin {
        hub = CptcHub(newHubAddress);
        emit HubAddressModified(newHubAddress);
    }

    function changeRegistrationFee(uint newValue) external onlyAdmin {
        registrationFee = newValue;
        emit RegistrationFeeChanged(newValue);
    }

    function withdraw() external onlyAdmin {
        IERC20 token = IERC20(hub.getContractAddress(TOKEN_HUB_IDENTIFIER));
        uint balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            require(token.transfer(msg.sender, balance));
            emit Withdrawal(msg.sender, balance);
        }
    }

    function addCategories(bytes32[] calldata _categories) external onlyAdmin {
        bytes32[] memory categoriesAdded = new bytes32[](_categories.length);
        uint nextAddIndex;

        for (uint i = 0; i < _categories.length; i++) {
            require(_categories[i] != "", "Empty category");
            if(categories.add(_categories[i])) {
                // set will add just elements not already present
                categoriesAdded[nextAddIndex] = _categories[i];
                nextAddIndex += 1;
            }
        }

        emit CategoryBulkAdded(categoriesAdded);
    }

    function addCategory(bytes32 _category) external onlyAdmin validCategory(_category) {
        if (categories.add(_category)) {
            emit CategoryAdded(_category);
        } else {
            revert("Category already present");
        }
    }

    function removeCategory(bytes32 _category) external onlyAdmin {
        if (categories.remove(_category)) emit CategoryRemoved(_category);
    }

    function registerCollection(address _collection, bytes32 _category) 
        external 
        onlyMarketeer 
        validCollection(_collection) 
        categoryExists(_category)
    {
        require(collectionCategory[_collection] == "", "Collection already registered");

        if (registrationFee > 0) { _collectFee(); }
        _registerCollection(_collection, _category);
        
        emit CollectionRegistered(_category, _collection);
    }

    function changeCollectionCategory(address _collection, bytes32 _newCategory)
        external 
        onlyMarketeer 
        validCollection(_collection)
        categoryExists(_newCategory)
    {
        bytes32 oldCategory = collectionCategory[_collection];
        require(oldCategory != "", "Collection not registered");

        categoryCollections[oldCategory].remove(_collection);
        _registerCollection(_collection, _newCategory);
        emit CollectionCategoryChanged(_collection, oldCategory, _newCategory);
    }

    function unregisterCollection(address _collection)
        external
        onlyMarketeer
        validCollection(_collection)
    {
        bytes32 category = collectionCategory[_collection];
        require(category != "", "Category not registered");
        
        delete collectionCategory[_collection];
        categoryCollections[category].remove(_collection);
        emit CollectionUnregistered(_collection, category);
    }

    function _registerCollection(address _collection, bytes32 _category) internal {
        categoryCollections[_category].add(_collection);
        collectionCategory[_collection] = _category;
    }

    function _collectFee() internal {
        IERC20 token = IERC20(hub.getContractAddress(TOKEN_HUB_IDENTIFIER));
        require(token.transferFrom(msg.sender, address(this), registrationFee));
    }
}