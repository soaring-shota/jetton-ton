import * as jettonMinter from "../wrappers/jetton-minter";
import fs from "fs";
import { Address, TupleSlice, WalletContract, Cell, beginCell } from "ton";
import dotenv from "dotenv";
import { BN } from "bn.js";
dotenv.config();

export function mint() {
    return jettonMinter.mint({
        toAddress: Address.parseFriendly("EQDpZxhM3Zvwi7YlS7UPkeQg3tSF8wDj592QxSDahgvSEpXq").address,
        gasAmount: new BN(1),
        jettonAmount: new BN(100000000),
    });
}

export function initMessage() {
    return null;
}

