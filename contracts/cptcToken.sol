// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;
 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
 
contract CPTCToken is ERC20 {
    address public admin;
 
    constructor() ERC20("Cultural Places Token Contract", "CPTC") {
        _mint(msg.sender, 500 * 10 ** 18);
        admin = msg.sender;
    }
 
    function mint(address to, uint amounts) external returns(bool) {
        // Only the contract owner have the right to mint
        require(msg.sender == admin, "Only admin is allowed to mint");
        // addess and amount should have the same length
       // require(to.length == amounts.length, 'senders array and amounts array are not equal');
        _mint(to, amounts);
        return true;
    }
 
    function burn(uint amount) external {
       //  User burner should own what he wants to burn
       require((balanceOf(msg.sender) > amount), "You can't burn more than you own");
       _burn(msg.sender, amount);
    }
 
    function balance(address add) view public returns (uint256) {
        return balanceOf(add);
    }
 
        function mintMany(address[] addresses, uint[] amounts) public returns (bool success) {
        // addess and amount should have the same length
        require(addresses.length == amounts.length, "senders array and amounts array are not equal");
        // loop on the array and send money for each one
        for( uint256 i=0;i < addresses.length; i++){
            balance(admin) -= amounts[i];
            balance(addresses[i]) += amounts[i];
            _transfer(admin, addresses[i], amounts[i]);
        }
        return true;
    }
}

