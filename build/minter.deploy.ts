import * as jettonMinter from "../wrappers/jetton-minter";
import fs from "fs";
import dotenv from "dotenv";
import { BN } from "bn.js";
import { Address, Cell } from "@ton/core";
dotenv.config();

export function initData() {
    if (process.env.ADMIN_ADDRESS === undefined)
        throw new Error("ADMIN_ADDRESS is not defined");

    return jettonMinter.data({
        totalSupply: BigInt(0),
        adminAddress: Address.parse(process.env.ADMIN_ADDRESS),
        jettonWalletCode: Cell.fromBoc(fs.readFileSync("build/jetton-wallet.cell"))[0],
    });
}

export function initMessage() {
    return null;
}

