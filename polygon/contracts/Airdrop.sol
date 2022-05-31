// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./CptcHub.sol";

contract Airdrop is Ownable {
    CptcHub public hub;

    string constant private TOKEN_HUB_IDENTIFIER = "TokenContract";

    constructor(address _hubContract) {
        hub = CptcHub(_hubContract);
    }

    function dropTokens(address[] memory _recipients, uint256[] memory _amount) public onlyOwner returns (bool) {
        for (uint i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0));
            IERC20 token = IERC20(hub.getContractAddress(TOKEN_HUB_IDENTIFIER));
            require(token.transfer(_recipients[i], _amount[i]));
        }

        return true;
    }

    function withdrawTokens(address beneficiary) public onlyOwner {
        IERC20 token = IERC20(hub.getContractAddress(TOKEN_HUB_IDENTIFIER));
        require(token.transfer(beneficiary, token.balanceOf(address(this))));
    }

    function setHubAddress(address newHubAddress) external onlyOwner {
        hub = CptcHub(newHubAddress);
    }
}