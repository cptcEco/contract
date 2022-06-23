# CPTC Hub Contract
The hub contract serves as a directory of contracts in the ecosystem and as a store for global permissions. Later we will use it to store global settings as well.

## Requirements
### Business Rules
The following business rules apply:
1. Set contract addresses with names as selectors and permissions.
2. Get contract address based on name
3. Permissions need to be retrieved.


### Functionalities 
The hub contract is used as a directory of other contract addresses present in the cptc ecosystem. Other contracts should have access to the hub and use it to access other contract addresses. E.g.: the StakingRewards contract will call the CptcHub contract to ask for the CptcToken contract address.
This way, one can easily replace a contract in the ecosystem with a new version. Owner will just have to change the address of the corresponding contract on the hub directory. 