import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient,JettonMaster, WalletContractV3R2, Address, WalletContractV4, toNano, beginCell, internal } from "@ton/ton";

import dotenv from "dotenv";
dotenv.config();

export async function transferStandardTon(args: {amount: string, toAddress: string}) {
    let chain: string, endpointUrl: string;

    if (process.env.TESTNET || process.env.npm_lifecycle_event == "deploy:testnet") {
        console.log(`\n* We are working with 'testnet' (https://t.me/testgiver_ton_bot will give you testnet TON)`);
        endpointUrl = "https://testnet.toncenter.com/api/v2/jsonRPC";
    } else {
        console.log(`\n* We are working with 'mainnet'`);
        endpointUrl = "https://toncenter.com/api/v2/jsonRPC";
    }

    // initialize globals
    const client = new TonClient({ endpoint: endpointUrl, apiKey: process.env.API_KEY });
    const workchain = 0;

    const deployConfigEnv = ".env";
    let deployerMnemonic;
    if (!process.env.DEPLOYER_MNEMONIC) {
        console.log(` - ERROR: No DEPLOYER_MNEMONIC env variable found, please add it to env`);
        process.exit(1);
    } else {
        console.log(`\n* Config file '${deployConfigEnv}' found and will be used for deployment!`);
        deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
    }
    
    const walletKey = await mnemonicToWalletKey(deployerMnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: walletKey.publicKey, workchain });
    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(walletKey.secretKey);
    const seqno = await walletContract.getSeqno();

    console.log(` - Wallet address used to deploy from is: ${walletContract.address}`);
    const walletBalance = await client.getBalance(walletContract.address);
    console.log('wallet balance is', walletBalance);


    await walletContract.sendTransfer({
        seqno,
        secretKey: walletKey.secretKey,
        messages: [ internal({
            value: toNano(args.amount),
            to: args.toAddress
        })]
    })

    console.log("transaction confirmed!");
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
