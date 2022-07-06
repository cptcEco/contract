// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../ERC721/extensions/Presaleable/PresaleableMintERC20.sol";

contract PresaleableERC20Example is PresaleableMintERC20 {
    constructor(address _currencyToken)
        BasePresaleable(10_000_000 wei)
        MintableWithERC20(1 ether, _currencyToken)
        Withdrawable(msg.sender)
        ERC721("PresaleableERC20Example", "PSERC20")
    {}
}