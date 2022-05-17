const fs = require('fs');
const Web3 = require('web3');
require('dotenv').config({ path: `./.env` });

const NFT_ADDRESS = '0xB6479a983576867eaC4b09cAF18FF8E2bE223EBD';

// initialize web3
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MUMBAI_ACCESS_KEY));
// initialize contracts
const nftFile = fs.readFileSync('./polygon/build/contracts/CptcNFTCollection.json');
const nftAbi = JSON.parse(nftFile).abi;
const nftContract = new web3.eth.Contract(
    nftAbi,
    NFT_ADDRESS,
);

class NftTest {

    async getNftUrl(nftId) {
        const nftUrl = await nftContract.tokenURI(nftId);

        console.log('NFT url: ', nftUrl);
    }

    async sendTransaction(tx, privateKey = process.env.MUMBAI_DEPLOYER_PRIVATE_KEY) {
        return new Promise((resolve, reject)=>{
            const signPromise = web3.eth.accounts.signTransaction(tx, privateKey);
            signPromise
                .then((signedTx) => {
                    web3.eth.sendSignedTransaction(
                        signedTx.rawTransaction,
                        function (err, hash) {
                            if (!err) {
                                console.log(
                                    "The hash of your transaction is: ",
                                    hash
                                )
                                resolve(hash)
                            } else {
                                console.log(
                                    "Something went wrong when submitting your transaction:",
                                    err
                                )
                                reject(err)
                            }

                        }
                    )
                })
                .catch((err) => {
                    console.log(" Promise failed:", err)
                    reject(err);
                })
        });
    }
    async startPresale() {
        const nonce = await web3.eth.getTransactionCount(process.env.MUMBAI_DEPLOYER_PUBLIC_KEY, "latest") //get latest nonce
        console.log('Nonce fetched');
        //the transaction
        const tx = {
            from: process.env.MUMBAI_DEPLOYER_PUBLIC_KEY,
            to: NFT_ADDRESS,
            nonce: nonce,
            gas: 500000,
            data: nftContract.methods.startPresale().encodeABI(),
        }
        console.log('Transaction generated');
        await this.sendTransaction(tx);
    }

    async whitelist(account) {
        const nonce = await web3.eth.getTransactionCount(process.env.MUMBAI_DEPLOYER_PUBLIC_KEY, "latest") //get latest nonce
        console.log('Nonce fetched');
        //the transaction
        const tx = {
            from: process.env.MUMBAI_DEPLOYER_PUBLIC_KEY,
            to: NFT_ADDRESS,
            nonce: nonce,
            gas: 500000,
            data: nftContract.methods.whitelist(account).encodeABI(),
        }
        console.log('Transaction generated');
        await this.sendTransaction(tx);
    }

    async mint(account, privateKey, amount) {
        const nonce = await web3.eth.getTransactionCount(account, "latest") //get latest nonce
        console.log('Nonce fetched');
        //the transaction
        const tx = {
            from: account,
            to: NFT_ADDRESS,
            nonce: nonce,
            value: 222,
            gas: 500000,
            data: nftContract.methods.preSaleMint(account, amount).encodeABI(),
        }
        console.log('Transaction generated');
        await this.sendTransaction(tx, privateKey);
    }

    async getPresalePrice() {
        const result = await nftContract.methods.getPresalePrice().call();
        console.log(result);
    }
}

const nftTest = new NftTest();
// nftTest.getNftUrl(1);
//nftTest.mint('ipfs://QmSR9ScrV23KMRMDNJr895QFEzdAVNBpt2dNDvgk6Zw7fb');

nftTest.startPresale();
// nftTest.whitelist(process.env.NFT_WHITELIST_ACC_PUBLIC);
// nftTest.mint(process.env.NFT_WHITELIST_ACC_PUBLIC, process.env.NFT_WHITELIST_ACC_PRIVATE, 1);