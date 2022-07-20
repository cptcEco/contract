# Whitelistable Abstract Contract
The Whitelistable abstract contract extends `ERC721` to provide support for whitelisting.

## Requirements
There are no requirements.


### Functionalities 
The owner can add or remove addresses from the whitelist, either individually or in bulk. A child contract can use `onlyWhitelisted` for some operations.
