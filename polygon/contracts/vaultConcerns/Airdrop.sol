// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Airdrop {
    event TokensDropped(address[] recipients, uint256[] amounts);
    event TokensWithdrawn(address beneficiary, uint256 balance);

    function dropTokens(address _cptc, address[] memory _recipients, uint256[] memory _amounts) internal {
        IERC20 token = IERC20(_cptc);

        for (uint i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0));
            require(token.transfer(_recipients[i], _amounts[i]));
        }

        emit TokensDropped(_recipients, _amounts);
    }

    function withdrawTokens(address _cptc, address _beneficiary) internal {
        IERC20 token = IERC20(_cptc);
        uint balance = token.balanceOf(address(this));
        
        require(token.transfer(_beneficiary, balance));
        emit TokensWithdrawn(_beneficiary, balance);
    }
}