import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient,JettonMaster, WalletContractV3R2, Address, WalletContractV4, toNano, beginCell } from "@ton/ton";

import dotenv from "dotenv";
dotenv.config();

export async function transferJpyw(args: {amount: bigint, toAddress: string}) {
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
    const wallet = WalletContractV3R2.create({ publicKey: walletKey.publicKey, workchain });
    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(walletKey.secretKey);
    const seqno = await walletContract.getSeqno();

    console.log(` - Wallet address used to deploy from is: ${walletContract.address}`);
    const walletBalance = await client.getBalance(walletContract.address);
    console.log('wallet balance is', walletBalance);
    // await sleep(3 * 1000);
    
    const jpywAddress = Address.parseFriendly(process.env.JPYW_MINTER_ADDRESS??"").address;

    const jettonMaster = client.open(JettonMaster.create(jpywAddress))
    const toJettonWalletAddress = await jettonMaster.getWalletAddress(Address.parse(args.toAddress));
    console.log('jpywjettonaddr', toJettonWalletAddress);
    
    const forwardPayload = beginCell()
        .storeUint(0, 32)
        .storeStringTail('From PassPay')
        .endCell();
    
    const messageBody = beginCell()
        .storeUint(0x0f8a7ea5, 32) // opcode for jetton transfer
        .storeUint(0, 64) // query id
        .storeCoins(args.amount) // jetton amount, amount * 10^9
        .storeAddress(Address.parse(args.toAddress))
        .storeAddress(Address.parse(args.toAddress)) // response destination
        .storeBit(0) // no custom payload
        .storeCoins(toNano('0.02')) // forward amount
        .storeBit(1) // we store forwardPayload as a reference
        .storeRef(forwardPayload)
        .endCell();

    const jpywAdminJettonWalletAddressString = "EQBr8pWA01NPdt9K24mJcEDnvQERGvG1kgJeZQ13AoKTv1uF";
    const jpywAdminJettonWalletAddress = Address.parse(jpywAdminJettonWalletAddressString);
    
    client.provider(jpywAdminJettonWalletAddress, null).internal(walletSender, 
        { value: "0.1", // send 0.002 TON for gas
        body: messageBody}
    );

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
