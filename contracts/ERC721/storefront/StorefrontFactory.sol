// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../../CptcHub.sol";
import "../../CollectionsRegistry.sol";
import "./StorefrontArt.sol";

contract StorefrontFactory is Ownable {
    string constant private REGISTRY_IDENTIFIER = "CollectionsRegistryContract";

    CptcHub private hub;
    address[] private deployedCollections;

    event Deployed(address indexed deployedAddress);

    modifier onlyAllowed() {
        CollectionsRegistry registry = CollectionsRegistry(hub.getContractAddress(REGISTRY_IDENTIFIER));
        require(msg.sender == owner() || registry.isMarketeer(msg.sender), "Not allowed");
        _;
    }

    constructor(address _hub) {
        hub = CptcHub(_hub);
    }

    function getCollectionsLength() external view returns (uint) {
        return deployedCollections.length;
    }

    function getCollection(uint _index) external view returns (address) {
        require(_index < deployedCollections.length, "Invalid index");
        return deployedCollections[_index];
    }

    function deploy(
        string calldata _name,
        string calldata _symbol,
        uint256 _price,
        address _defaultWithdrawAddress,
        string calldata _baseUri,
        string calldata _contractUri  // NOTE: add category to register (?)
    )
        external 
        onlyAllowed 
    {
        StorefrontArt collection = new StorefrontArt(
            _name,
            _symbol,
            _price, 
            _defaultWithdrawAddress,
            _baseUri,
            _contractUri
        );
        deployedCollections.push(address(collection));

        emit Deployed(address(collection));
    }

    /**
     @dev forwarding function. Not completely a proxy function, since we're using call here, not delegatecall
     The value payed to the function is forwarded, but msg.sender on the collection execution will be address(this)
     @param _msgData : this is the encoded data of a function call, which should be a concatenation between function selector and arguments
     A way to compute this in solidity would be something like:
     `abi.encodeWithSignature("someExampleFunction(uint256,address)", someUint, someAddress)`
     ethers.js also has some functions to properly compute this
     */
    function callStorefront(
        uint _index,
        bytes calldata _msgData
    )
        external
        payable
        onlyAllowed
        returns (bytes memory) 
    {
        require(_index < deployedCollections.length, "Invalid index");

        (bool success, bytes memory data) = deployedCollections[_index].call{value: msg.value}(_msgData);
        require(success, "Unsuccessful call");

        return data;
    }
}