import BN from "bn.js";
import { beginMessage } from "./helpers";
import { Address, Cell, beginCell } from "@ton/ton";

export function data(params: {
    status: bigint;
    balance: bigint;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
}): Cell {
    return beginCell()
        .storeUint(params.status, 4)
        .storeCoins(params.balance)
        .storeAddress(params.ownerAddress)
        .storeAddress(params.jettonMasterAddress)
        .storeRef(params.jettonWalletCode)
        .endCell();
}


// export function setStatus(params: { newStatus: BN }): Cell {
//     return beginMessage({ op: new BN(100) })
//         .storeUint(params.newStatus, 4)
//         .endCell();
// }

export function addToBlockList() : Cell {
    return beginMessage({op: BigInt(100)})
        .endCell();
}

export function removeFromBlockList() : Cell {
    return beginMessage({op: BigInt(101)})
        .endCell();
}

export function burn(params: { jettonAmount: bigint; responseAddress?: Address }): Cell {
    return beginMessage({ op: BigInt(0x595f07bc) })
        .storeCoins(params.jettonAmount)
        .storeAddress(params.responseAddress || null)
        .endCell();
}

export function transfer(params: {
    jettonAmount: bigint;
    toAddress: Address;
    forwardTonAmount?: bigint;
    responseAddress?: Address
}): Cell {
    return beginMessage({ op: BigInt(0xf8a7ea5) })
        .storeCoins(params.jettonAmount)
        .storeAddress(params.toAddress)
        .storeAddress(params.responseAddress || null)
        .storeBit(false)
        .storeCoins(params.forwardTonAmount || BigInt(0))
        .storeBit(false)
        .endCell();
}

export function internalTransfer(params: {
    jettonAmount: bigint;
    fromAddress: Address;
    forwardTonAmount?: bigint;
    responseAddress?: Address
}): Cell {
    return beginMessage({ op: BigInt(0x178d4519) })
        .storeCoins(params.jettonAmount)
        .storeAddress(params.fromAddress)
        .storeAddress(params.responseAddress || null)
        .storeCoins(params.forwardTonAmount || BigInt(0))
        .storeBit(false)
        .endCell();
}