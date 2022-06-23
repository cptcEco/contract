# VaultFactory Contract
The VaultFactory contract is used to create, delete and index vaults (Vault contract).

## Requirements
One must pass the hub contract address and the sushi router address as parameters. The hub will have the CPTC token address in its directory, and the sushi router is used in Vault contracts to convert funds to CPTC.


### Functionalities 
A user can create a Vault contract with VaultFactory, linking it to an NFT collection. The user can delete the Vault when desired.
