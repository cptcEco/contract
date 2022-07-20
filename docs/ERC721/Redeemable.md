# Redeemable Abstract Contracts
The Redeemable abstract contract extends `ERC721URIStorage` to provide a basic redeemability functionality to the ERC721 token.

## Requirements
One must pass a base uri as parameter, to be set when a given token is redeemed


### Functionalities 
An owner can start a *redeem* period. A user can `redeem` each of their tokens only once. A redeemed token has a different base uri than a non redeemed token.
