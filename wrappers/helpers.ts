import BN from "bn.js";
import { Builder, beginCell } from "@ton/ton";

export function beginMessage(params: { op: bigint }): Builder {
    return beginCell()
        .storeUint(params.op, 32)
        .storeUint(BigInt(Math.floor(Math.random() * Math.pow(2, 31))), 64);
}
