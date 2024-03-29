// SPDX-License-Identifier: MIT
// todo update license
pragma solidity ^0.8.0;
 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Permit.sol";

import {CptcHub} from "./CptcHub.sol";
 
contract CptcToken is Ownable, ERC20Permit {

    uint256 public constant INITIAL_MINT_VOLUME = 495e23; //49 500 000

    CptcHub public hub;
 
    // todo add addresses that will receive initial mint tokens
    constructor(address hubAddress, address mintAddress) ERC20("Cultural Places Token Contract", "CPTC") {
        require(hubAddress != address(0), "Hub address not specified");
		require(mintAddress != address(0), "Mint address not specified");
        hub = CptcHub(hubAddress);

        _mint(mintAddress, INITIAL_MINT_VOLUME);
    }

    function setHubAddress(address newHubAddress) external onlyOwner {
        hub = CptcHub(newHubAddress);
    }

    modifier allowedToMint(address account) {
        // get authorisation mask from hub
        require (hub.getContractAuthorisation(account) == 1 || hub.getContractAuthorisation(account) == 3, "Bad authorisation rights for minting");
        _ ;
    }

    modifier allowedToBurn(address account) {
        // get authorisation mask from hub
        require (hub.getContractAuthorisation(account) == 2 || hub.getContractAuthorisation(account) == 3, "Bad authorisation rights for burning");
        _ ;
    }
 
    function mint(address to, uint amounts) external allowedToMint(msg.sender) returns(bool) {
        _mint(to, amounts);
        return true;
    }
 
    function burn(address from, uint amount) external allowedToBurn(msg.sender){
       require((balanceOf(from) >= amount), "You can't burn more than you own");
       _burn(from, amount);
    }
 
    function balance(address add) external view returns (uint256) {
        return balanceOf(add);
    }
}

