const fs = require('fs');
const Web3 = require('web3');
require('dotenv').config({ path: `./.env` });

const NFT_ADDRESS = '0x2d831B3d90377eDA7E9C546bE59518895A3cB206';

// initialize web3
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MUMBAI_ACCESS_KEY));
// initialize contracts
const nftFile = fs.readFileSync('./polygon/build/contracts/CptcNFTDjordjeTest.json');
const nftAbi = JSON.parse(nftFile).abi;
const nftContract = new web3.eth.Contract(
    nftAbi,
    NFT_ADDRESS,
);

class NftTest {

    async mint(tokenURI) {
        
        const nonce = await web3.eth.getTransactionCount(process.env.MUMBAI_DEPLOYER_PUBLIC_KEY, "latest") //get latest nonce
        console.log('Nonce fetched');
        //the transaction
        const tx = {
            from: process.env.MUMBAI_DEPLOYER_PUBLIC_KEY,
            to: NFT_ADDRESS,
            nonce: nonce,
            gas: 500000,
            data: nftContract.methods.mintNFT(process.env.MUMBAI_DEPLOYER_PUBLIC_KEY, tokenURI).encodeABI(),
        }
        console.log('Transaction generated');
        const signPromise = web3.eth.accounts.signTransaction(tx, process.env.MUMBAI_DEPLOYER_PRIVATE_KEY);
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
                        } else {
                            console.log(
                                "Something went wrong when submitting your transaction:",
                                err
                            )
                        }
                    }
                )
            })
            .catch((err) => {
                console.log(" Promise failed:", err)
            })
    }

    async getNftUrl(nftId) {
        const nftUrl = await nftContract.tokenURI(nftId);

        console.log('NFT url: ', nftUrl);
    }
}

const nftTest = new NftTest();
nftTest.getNftUrl(1);
//nftTest.mint('ipfs://QmSR9ScrV23KMRMDNJr895QFEzdAVNBpt2dNDvgk6Zw7fb');