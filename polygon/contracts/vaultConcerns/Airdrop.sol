// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Airdrop is ReentrancyGuard {
    mapping(address => uint256) internal tokensToClaim;

    event TokensDropped(address[] recipients, uint256[] amounts);
    event TokensAssigned(address[] recipients, uint256[] amounts);
    event Claimed(address indexed user, uint256 amount);

    function _dropTokens(address _cptc, address[] calldata _recipients, uint256[] calldata _amounts) internal nonReentrant {
        IERC20 token = IERC20(_cptc);

        for (uint i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0));
            require(token.transfer(_recipients[i], _amounts[i]));
        }

        emit TokensDropped(_recipients, _amounts);
    }

    /** 
     * @dev Contrary to _dropTokens, this function gives recipients permission to manually claim tokens
     */
    function _assignTokens(address[] calldata _recipients, uint256[] calldata _amounts) internal {
        for (uint i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0));
            tokensToClaim[_recipients[i]] += _amounts[i];
        }

        emit TokensAssigned(_recipients, _amounts);
    }

    function _claimTokens(address _cptc, uint256 amount) internal nonReentrant {
        require(tokensToClaim[msg.sender] >= amount, "User cannot claim that amount of tokens");
        
        IERC20 token = IERC20(_cptc);
        tokensToClaim[msg.sender] -= amount;
        token.transfer(msg.sender, amount);

        emit Claimed(msg.sender, amount);
    }
}