// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract Whitelistable is Ownable, ERC721 {
    mapping(address => bool) private _whitelist;

    modifier onlyWhitelisted(address _address) {
        require(isWhitelisted(_address), "Only whitelisted accounts");
        _ ;
    }

    event Whitelist(address whitelisted);

    function isWhitelisted(address _address) public view returns (bool) {
        return _whitelist[_address];
    }

    function whitelist(address _address) public onlyOwner {
        require(_address != address(0));
        _whitelist[_address] = true;
        emit Whitelist(_address);
    }

    function _removeFromWhitelist(address _address) internal {
        require(_address != address(0));
        _whitelist[_address] = false;
    }

    function whitelistBulk(address[] calldata _addresses) public onlyOwner {
        for (uint i=0; i<_addresses.length; i++) {
            whitelist(_addresses[i]);
        }
    }
}