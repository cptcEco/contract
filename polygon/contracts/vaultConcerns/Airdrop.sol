// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Airdrop is ReentrancyGuard {
    event TokensDropped(address[] recipients, uint256[] amounts);

    function _dropTokens(address _cptc, address[] calldata _recipients, uint256[] calldata _amounts) internal nonReentrant {
        // NOTE: not an efficient way to do a big airdrop, for that should use MerkleDistributor
        IERC20 token = IERC20(_cptc);

        for (uint i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0));
            require(token.transfer(_recipients[i], _amounts[i]));
        }

        emit TokensDropped(_recipients, _amounts);
    }
}