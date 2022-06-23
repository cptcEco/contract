# Vault Contract
The Vault contract is used as both a treasury and airdrop/converter. A marketeer will create a Vault and transfer funds to it. Those funds will be airdropped as CPTC tokens.

## Requirements
No parameters need to be passed in the constructor. A Vault contract should only be created by a VaultFactory contract, which would also call the `initialize` method.

### Functionalities 
A user can create a Vault contract with VaultFactory, linking it to an NFT collection. The user can delete the Vault when desired.

1. **Converter**: tokens or native currency can be converted to cptc to be used for airdrops. Those funds are converted through the sushi router.
2. **Aidrop**: cptc tokens are transfered to a set of addresses. This is an expensive function to use for a large amount of recipients, so it should be saved only for specific use cases where one wants to immediately transfer tokens to a small set of addresses. For a bigger set, one should use the MerkleDistributor.
3. **MerkleDistributor**: addresses entitled to claim tokens are stored on an offchain database, and a merkle root is computed with them as leaf nodes. The merkle root is stored on the blockchain, and the claim platform generates the merkle proofs for users with the right to claim tokens. The owner of the vault may generate more merkle trees for the same Vault.