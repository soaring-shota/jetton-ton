import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient,JettonMaster, WalletContractV3R2, Address, WalletContractV4, toNano } from "@ton/ton";
import JpywJettonMinter from "../wrappers/jetton-minter-contract";

import dotenv from "dotenv";
dotenv.config();

export async function mintJpyw(args: {mintAmount: bigint, toAddress: string}) {
    let chain: string,
        endpointUrl: string,
        apiKey: string;
    if (process.env.TESTNET || process.env.npm_lifecycle_event == "deploy:testnet") {
        console.log(`\n* We are working with 'testnet' (https://t.me/testgiver_ton_bot will give you testnet TON)`);
        endpointUrl = "https://testnet.toncenter.com/api/v2/jsonRPC";
        apiKey = process.env.API_KEY_TESTNET ?? "";
    } else {
        console.log(`\n* We are working with 'mainnet'`);
        endpointUrl = "https://toncenter.com/api/v2/jsonRPC";
        apiKey = process.env.API_KEY_MAINNET ?? "";
    }

    // initialize globals
    const client = new TonClient({ endpoint: endpointUrl, apiKey: apiKey });
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
    
    const jpywAddress = Address.parseFriendly(process.env.JPYW_MINTER_ADDRESS??"").address;
    const jpyw = new JpywJettonMinter(jpywAddress);
    const jpywContract = client.open(jpyw);

    const provider = client.provider(jpywAddress, null);
    await jpywContract.mint(provider, walletSender, 
        {
            toAddress: Address.parse(args.toAddress),
            jettonAmount: args.mintAmount,
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

    const jettonMaster = client.open(JettonMaster.create(jpywAddress))
    const toJettonWalletAddress = await jettonMaster.getWalletAddress(Address.parse(args.toAddress));
    console.log("JPYW Jetton Wallet Address: ", toJettonWalletAddress);

    return toJettonWalletAddress;
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
