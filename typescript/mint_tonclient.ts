import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient,JettonMaster, WalletContractV3R2, Address, WalletContractV4, toNano } from "@ton/ton";
import JpywJettonMinter from "../wrappers/jetton-minter-contract";

import dotenv from "dotenv";
import { NetworkProvider } from '@ton/blueprint';
dotenv.config();

export async function run(provider: NetworkProvider) {
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
    await sleep(3 * 1000);
    
    const jpywAddress = Address.parseFriendly("EQBIql1mucKdpPyBag5YeP7-D0Be4FGP0lKE4YUPr5wHpifE").address;
    const jpyw = new JpywJettonMinter(jpywAddress);
    const jpywContract = client.open(jpyw);

    const jettonMaster = client.open(JettonMaster.create(jpywAddress))
    const toJettonWalletAddress = await jettonMaster.getWalletAddress(walletContract.address);
    console.log('jpywjettonaddr', toJettonWalletAddress);
    await jpywContract.sendMint(walletSender, 
        {
            toAddress: Address.parse("EQCM4c41g1YiC-Qlh7yYdY8wLqS4sM5eWncLmH_aTgCthNCR"),
            // toAddress: toJettonWalletAddress,
            jettonAmount: BigInt("5000000000"),
            forwardTonAmount: toNano("0.05"),
        }
    )

    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        //console.log("waiting for transaction to confirm...");
        await sleep(1500);
        currentSeqno = await walletContract.getSeqno();
    }
    console.log("transaction confirmed!");
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// run();