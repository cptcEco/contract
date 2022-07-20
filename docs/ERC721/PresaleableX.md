# PresaleableX Abstract Contracts
The Presaleable abstract contracts extend `Whitelistable` and `ERC721Enumerable` to provide support for presale minting. There are two child abstract contracts available extending `BasePresaleable`: `PresaleableMintERC20` (extends `MintableWithERC20`) and `PresaleableMintNative` (extends `MintableWithNative`).

## Requirements
No specific requirements for these extensions.


### Functionalities 
The owner can start or stop the presale, and change various configurations. Only whitelisted users can `preSaleMint` a number of tokens, if the price is covered. This function, as with all `virtual` ones, can be overriden to add more capacities.
