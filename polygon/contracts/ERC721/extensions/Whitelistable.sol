// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract Whitelistable is Ownable, ERC721 {
    mapping(address => bool) _whitelist;

    modifier onlyWhitelisted(address _address) {
        require(_whitelist[_address], "Only whitelisted accounts");
        _ ;
    }

    function whitelist(address _address) public onlyOwner {
        require(_address != address(0));
        _whitelist[_address] = true;
    }

    function _removeFromWhitelist(address _address) private {
        require(_address != address(0));
        _whitelist[_address] = false;
    }

    function whitelistBulk(address[] calldata _addresses) public onlyOwner {
        for (uint i=0; i<_addresses.length; i++) {
            whitelist(_addresses[i]);
        }
    }
}