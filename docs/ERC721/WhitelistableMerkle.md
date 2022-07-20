# WhitelistableMerkle Abstract Contract
The WhitelistableMerkle abstract contract extends `ERC721` to provide support for merkle whitelisted minting.

## Requirements
A merkle root must be passed as parameter to the constructor. This root needs to be computed offchain, and leaf nodes need to be stored on some database.


### Functionalities 
A user can mint a token, if they are able to provide a merkle proof. The merkle proof is supposedly computed by an offchain backend that reads the leaf nodes from a database. A child contract can use `onlyWhitelisted` for some operations.
