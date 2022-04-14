# CPTC Token ERC20 Contract
CPTC Token smart contract, ERC20 token. Standard contract with some functionallity added for Burning / Minting 

## Requirements
### Business Rules
The following business rules apply:
1. A fixed amount of 49.5 million tokens is minted initially.
2. Further tokens can only be minted by approved contracts (i.e. the Rewards Contract).
3. Tokens can only be burned by approved contracts.

### Functionalities 
#### Initial Mint
Minting 49.5 mio tokens, only accessible through rewards contract. Transfer them to the desired address.
#### Minting
Minting tokens, only accessible through rewards contract currently. Transfer them to the desired address. 
#### Burning
Burning Tokens, only accessible through rewards contract currently.
#### SetHubAddress
Set the hub contract address. Accessible by owner only.
