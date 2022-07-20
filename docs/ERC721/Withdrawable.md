# Withdrawable Abstract Contract
The Withdrawable abstract contract extends `ERC721` to provide percentage withdrawals of tokens owned by the contract.

## Requirements
One must pass a default withdraw address as parameter. The defaultWithdrawAddress will be used to transfer remaining tokens after percentage distribution.


### Functionalities 
A user can add withdrawal addresses with associated percentages. Anyone can call the `withdraw` function, which will basically transfer all token funds to the list of withdraw addresses, according to the percentages associated to them.
