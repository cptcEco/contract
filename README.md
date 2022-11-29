# CPTC Ecosystem Contracts
See the [docs](docs/index.md) for more information.

## Deployments
| Chain            | Contract                    | Address                                    |
|------------------|-----------------------------|--------------------------------------------|
| Polygon Prod     | Hub Contract                | 0x302c919e7D1f14A798Bb43b0d161d2Fc0E782D0D |
| Polygon Prod     | Token Contract              | 0x0a97853c72cB28C98B3112AE45215391675CAc43 |
| Polygon Mumbai   | Hub Contract                | 0xace95320F30cd2652A26Ef58132F5c4321d4eE46 |
| Polygon Mumbai   | Token Contract              | 0xe32E112aeA7a48992344c472889e1045dcB95551 |
| Polygon Mumbai   | StakingRewards Contract     | 0xdB9C00E43199d07bf689F9ccCAD154955Fb7BD19 |
| Polygon Mumbai   | VaultFactory Contract       | 0x81e89195f71f27939c1B01A97804b80343A0E02F |

## How to deploy collections

Steps to deploy collections:

0. Run: npm install 

1. Create .env file in root folder of the project and add public and private keys:
    MUMBAI_DEPLOYER_PUBLIC_KEY=<public_key>
    MUMBAI_DEPLOYER_PRIVATE_KEY=<private_key> 

2. Run command: npm run truffle:compile

3. For deploying contracts use following commands:
    Art: npm run start truffle:deploy:artcollections
    Media: npm run start truffle:deploy:mediacollections
    Ticket: npm run start truffle:deploy:ticketcollections
    Redeemable: npm run start truffle:deploy:redeemablecollections

If you want to change name, symbol, baseUrl... for collection you can do it by changing the parameters send during the deployment in 2_total_migration.js
e.g. Changing the name of deployed art collection: open 2_total_migration, find case for art collection and change line 105.

4. After deployment is completed you can find address of deployed contract in logs. e.g. Contract <contract_name> deployed on address: 0xc99ea0FB9d03589dcfE81851bb5199BCd0598718

