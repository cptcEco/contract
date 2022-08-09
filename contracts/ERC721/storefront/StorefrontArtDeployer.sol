// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../../CptcHub.sol";
import "../../CollectionsRegistry.sol";
import "./StorefrontArt.sol";

contract StorefrontArtDeployer is Ownable {
    string constant private REGISTRY_IDENTIFIER = "CollectionsRegistryIdentifier";

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

    function getCollection(uint index) external view returns (address) {
        require(index < deployedCollections.length, "Invalid index");
        return deployedCollections[index];
    }

    function deploy(
        string calldata _name,
        string calldata _symbol,
        uint256 _price,
        address _defaultWithdrawAddress,
        string calldata _baseUri,
        string calldata _contractUri
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
}