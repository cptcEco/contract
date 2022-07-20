# MintableX Abstract Contracts
The Mintable abstract contracts extend `Withdrawable` to provide support for sale minting. There are two child abstract contracts available: `MintableWithERC20` and `MintableWithNative`.

## Requirements
- `MintableWithERC20` - receives a mint price and the currency token address to make payments with.
- `MintableWithNative` - receives a mint price (native units)


### Functionalities 
The owner can start or stop the sale, and change various configurations. Any user can `mint` a number of tokens, if the price is covered. This function, as with all `virtual` ones, can be overriden to add more capacities.
