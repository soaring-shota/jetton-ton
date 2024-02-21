import axios from "axios";
import axiosThrottle from "axios-request-throttle";
axiosThrottle.use(axios, { requestsPerSecond: 0.5 });

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import glob from "fast-glob";
import { mnemonicNew, mnemonicToWalletKey } from "ton-crypto";
import { WalletContractV4, TonClient, toNano, fromNano, Cell} from "@ton/ton";
import JpywJettonMinter from "../wrappers/jetton-minter-contract";
import { stringify } from "querystring";

async function run() {
    console.log(`=================================================================`);
    console.log(`Deploy script running, let's find some contracts to deploy..`);

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
    const newContractFunding = toNano(0.1); // this will be (almost in full) the balance of a new deployed contract and allow it to pay rent
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
    console.log(` - Wallet address used to deploy from is: ${walletContract.address}`);
    const walletBalance = await client.getBalance(walletContract.address);
    console.log('wallet balance is', walletBalance);
    
    await sleep(3 * 1000);
    if (walletBalance < (toNano(0.2))) {
        console.log(` - ERROR: Wallet has less than 0.2 TON for gas (${fromNano(walletBalance)} TON), please send some TON for gas first`);
        process.exit(1);
    } else {
        console.log(` - Wallet balance is ${fromNano(walletBalance)} TON, which will be used for gas`);
    }

    // const rootContracts = glob.sync(["build/*.deploy.ts"]);
    //     console.log(`\n* Found root contract '${rootContract} - let's deploy it':`);
    //     const contractName = path.parse(path.parse(rootContract).name).name;

        const cellArtifact = `build/jetton-minter.cell`;
        if (!fs.existsSync(cellArtifact)) {
            console.log(` - ERROR: '${cellArtifact}' not found, did you build?`);
            process.exit(1);
        }
        const initCodeCell = Cell.fromBoc(fs.readFileSync(cellArtifact))[0];
        const initDataCell = Cell.fromBoc(fs.readFileSync("build/jetton-wallet.cell"))[0];
        
        const jpyw = JpywJettonMinter.createForDeploy(initCodeCell, 
            {
                totalSupply: BigInt("0"), 
                adminAddress: walletContract.address,
                jettonWalletCode: initDataCell,
            }
        )
        
        const newContractAddress = jpyw.address;
        console.log(` - Based on your init code+data, your new contract address is: ${newContractAddress}`);
        if (await client.isContractDeployed(newContractAddress)) {
            console.log(` - Looks like the contract is already deployed in this address, skipping deployment`);
            return;
        }
        await sleep(2000);

        console.log(` - Let's deploy the contract on-chain..`);
        const seqno = await walletContract.getSeqno();
        await sleep(2000);

        const jpywContract = client.open(jpyw);
        await jpywContract.sendDeploy(walletSender);

        let currentSeqno = seqno;
        while (currentSeqno == seqno) {
            console.log("waiting for deploy transaction to confirm...");
            await sleep(1500);
            currentSeqno = await walletContract.getSeqno();
        }
        console.log("deploy transaction confirmed!");

    console.log(``);
}

run();

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}