// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract Withdrawable is Ownable, ERC721 {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private withdrawAddresses;
    mapping(address => uint) public withdrawAddressPercentages;
    address public defaultWithdrawAddress;

    event Withdraw(address indexed token);
    event SetDefaultAddress(address indexed newAddress);
    event SetWithdrawAddress(address newAddress, uint percentage);
    event RemoveWithdrawAddress(address removed);

    constructor(address _defaultWithdrawAddress) {
        defaultWithdrawAddress = _defaultWithdrawAddress;
    }

    function withdraw(address token) public virtual {
        uint balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "Token balance is 0");
        for (uint8 i = 0; i < withdrawAddresses.length(); i++) {
            address withdrawAddress = withdrawAddresses.at(i);
            IERC20(token).transfer(withdrawAddress, balance.mul(withdrawAddressPercentages[withdrawAddress]).div(100));
        }

        if (defaultWithdrawAddress != address(0)) {
            uint afterBalance = IERC20(token).balanceOf(address(this));
            if (afterBalance != 0) {
                IERC20(token).transfer(defaultWithdrawAddress, afterBalance);
            }
        }

        emit Withdraw(token);
    }

    function getWithdrawAddresses() external view returns (address[] memory) {
        return withdrawAddresses.values();
    }

    function setDefaultWithdrawAddress(address newDefaultAddress) external onlyOwner {
        require(newDefaultAddress != address(0), "Withdraw address cannot be 0x00");
        defaultWithdrawAddress = newDefaultAddress;
        emit SetDefaultAddress(newDefaultAddress);
    }

    function removeWithdrawAddress(address toRemove) external onlyOwner {
        require(toRemove != address(0), "Address cannot be 0x00");
        require(withdrawAddresses.contains(toRemove), "Address not present");
        withdrawAddressPercentages[toRemove] = 0;
        withdrawAddresses.remove(toRemove);
        emit RemoveWithdrawAddress(toRemove);
    }

    function setWithdrawAddress(address newAddress, uint percentage) external onlyOwner {
        require(newAddress != address(0), "Withdraw address cannot be 0x00");
        require(percentage != 0, "Percentage cannot be 0");
        require(percentage <= 100, "Percentage cannot be greater than 100");

        uint percentageSum = getPercentageSum();
        if (withdrawAddresses.contains(newAddress)) {
            // Only percentage change
            require(
                percentageSum - withdrawAddressPercentages[newAddress] + percentage <= 100,
                "Percentage sum cannot be greater than 100"
            );
            withdrawAddressPercentages[newAddress] = percentage;
        } else {
            // New addition
            require(percentageSum + percentage <= 100, "Percentage sum cannot be greater than 100");
            withdrawAddresses.add(newAddress);
            withdrawAddressPercentages[newAddress] = percentage;
        }

        emit SetWithdrawAddress(newAddress, percentage);
    }

    function getPercentageSum() internal view returns (uint sum) {
        for (uint8 i = 0; i < withdrawAddresses.length(); i++) {
            address withdrawAddress = withdrawAddresses.at(i);
            sum += withdrawAddressPercentages[withdrawAddress];
        }
    }
}