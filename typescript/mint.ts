import TonWeb from "tonweb";
import JpywJettonMinter from "../wrappers/jetton-minter-contract";
import { Address, WalletContractV4, toNano } from "@ton/ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { transfer } from '../wrappers/jetton-wallet';

const {JettonMinter, JettonWallet} = TonWeb.token.jetton;

import dotenv from "dotenv";
import { mint } from "../wrappers/jetton-minter";
dotenv.config();

async function main() {
    let chain: string, endpointUrl: string;

    let deployerMnemonic;
    const workchain = 0;
    
    if (process.env.TESTNET || process.env.npm_lifecycle_event == "deploy:testnet") {
        console.log(`\n* We are working with 'testnet' (https://t.me/testgiver_ton_bot will give you testnet TON)`);
        // endpointUrl = "https://testnet.toncenter.com/api/v2/jsonRPC";
        endpointUrl = "https://testnet.tonapi.io/v2/jsonRPC";
    } else {
        console.log(`\n* We are working with 'mainnet'`);
        endpointUrl = "https://toncenter.com/api/v2/jsonRPC";
    }

    if (!process.env.DEPLOYER_MNEMONIC) {
        console.log(` - ERROR: No DEPLOYER_MNEMONIC env variable found, please add it to env`);
        process.exit(1);
    } else {
        console.log(`\n* Config file .env found and will be used for deployment!`);
        deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
    }

    const walletKey = await mnemonicToWalletKey(deployerMnemonic.split(" "));

    const tonweb = new TonWeb(new TonWeb.HttpProvider(endpointUrl, {apiKey: process.env.API_KEY}));
    // const tonweb = new TonWeb(new TonWeb.HttpProvider("https://ton-rpc.passpay.io/jsonRPC"));

    const WalletClass = tonweb.wallet.all['v3R2'];
    const wallet = new WalletClass(tonweb.provider, {
        publicKey: walletKey.publicKey,
        wc: 0
    });

    const walletAddress = await wallet.getAddress();
    const addr = "EQCfQqSE3TUD6-8FtmrL6HsGqe2tjhw60KKL8hpBr3eBDb2o";
    console.log('wallet address=', walletAddress.toString(true, true, true));

    const jpywInfo = {
        // address: "EQBIql1mucKdpPyBag5YeP7-D0Be4FGP0lKE4YUPr5wHpifE",
        address: "EQBJ4La4gi6qAQqLl3-EC7M7D7bXUdFwVmMlUJNlgV5dES0H",
        decimals: 2
    }

    const jpywJettonWallet = new TonWeb.token.ft.JettonWallet(tonweb.provider, {
        address: jpywInfo.address
    });

    const seqno = (await wallet.methods.seqno().call()) || 0;
    console.log({seqno})

    const minter = new JettonMinter(tonweb.provider, {
        address: jpywInfo.address,
        adminAddress: walletAddress,
        jettonContentUri: '',
        jettonWalletCodeHex: TonWeb.token.ft.JettonWallet.codeHex
    });
    const minterAddress = await minter.getAddress();
    console.log('minter address ', minterAddress.toString(true, true, true));
    // console.log('uri: ', (await minter.getJettonData()));
    console.log('yyyyyyy', walletAddress);
    console.log('xxxxxxxx', minter.createMintBody({
        tokenAmount: TonWeb.utils.toNano('100'),
        destination: walletAddress,
        amount: TonWeb.utils.toNano('0.04')
    }));
    console.log(
        await wallet.methods.transfer({
            secretKey: walletKey.secretKey,
            toAddress: minterAddress.toString(true, true, true),
            amount: TonWeb.utils.toNano('0.5'),
            seqno: seqno,
            payload: minter.createMintBody({
                tokenAmount: TonWeb.utils.toNano('100'),
                destination: walletAddress,
                amount: TonWeb.utils.toNano('0.04')
            }),
            sendMode: 3,
        }).send()
    );

    // const walletAddress = "EQCM4c41g1YiC-Qlh7yYdY8wLqS4sM5eWncLmH_aTgCthNCR";
    // // const walletKey = await mnemonicToWalletKey(deployerMnemonic.split(" "));
    // // const wallet = WalletContractV4.create({ publicKey: walletKey.publicKey, workchain });
    // // const walletContract = client.open(wallet);
    // // const walletSender = walletContract.sender(walletKey.secretKey);

    // const jettonMinter = new TonWeb.token.jetton.JettonMinter(tonweb.provider, {address: jpywInfo.address});
    // const address = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(walletAddress));
    // const addressTo = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address("EQDpZxhM3Zvwi7YlS7UPkeQg3tSF8wDj592QxSDahgvSEpXq"));
    // // It is important to always check that wallet indeed is attributed to desired Jetton Master:
    // const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
    //     address: address
    // });

    // const jettonData = await jettonWallet.getData();
    // if (jettonData.jettonMinterAddress.toString(false) !== new TonWeb.utils.Address(info.address).toString(false)) {
    // throw new Error('jetton minter address from jetton wallet doesnt match config');
    // }

    // const seqno = (await wallet.methods.seqno().call()) || 0;

    // wallet.methods.transfer({
    //     secretKey: walletKey,
    //     toAddress: addressTo,
    //     amount: TonWeb.utils.toNano("0.05"),
    //     seqno: seqno,

    // })
    // console.log('Jetton wallet address:', address.toString(true, true, true));

}

main().then(()=>{
    console.log('succeed');
}).catch((err)=>{
    console.log('Error: ', err);
});