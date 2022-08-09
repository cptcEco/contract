// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

abstract contract MarketeerManagement is AccessControlEnumerable {
    bytes32 public constant MARKETEER_ROLE = keccak256("MARKETEER_ROLE");

    modifier onlyAdmin() {
        _checkRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _;
    }

    modifier onlyMarketeer() {
        _checkRole(MARKETEER_ROLE, _msgSender());
        _;
    }

    constructor(address _admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function isMarketeer(address _addr) external view returns (bool) {
        return hasRole(MARKETEER_ROLE, _addr);
    }

    function addMarketeer(address _marketeer) external {
        // Access to this function is being controlled on the grantRole level
        grantRole(MARKETEER_ROLE, _marketeer);
    }

    function removeMarketeer(address _marketeer) external {
        // Access to this function is being controlled on the grantRole level
        revokeRole(MARKETEER_ROLE, _marketeer);
    }
}