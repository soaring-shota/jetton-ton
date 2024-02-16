import { ContractProvider, Sender, Address, Cell, contractAddress, beginCell, toNano, Contract } from "@ton/core";
export default class JpywJettonMinter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}

    static createForDeploy(code: Cell, params: {
        totalSupply: bigint;
        adminAddress: Address;
        jettonWalletCode: Cell;
    }): JpywJettonMinter {
      const data =beginCell()
        .storeCoins(params.totalSupply)
        .storeAddress(params.adminAddress)
        .storeUint(0, 2)
        .storeRef(params.jettonWalletCode)
        .endCell();
      const workchain = 0; // deploy to workchain 0
      const address = contractAddress(workchain, { code, data });
      return new JpywJettonMinter(address, { code, data });
    }

    async sendDeploy(provider: ContractProvider, via: Sender) {
      await provider.internal(via, {
        value: "0.1", // send 0.01 TON to contract for rent
        bounce: false
      });
    }
    
    async sendMint(provider: ContractProvider, via: Sender, params: { toAddress: Address; jettonAmount: bigint; fromAddress?: Address; responseAddress?: Address; forwardTonAmount?: bigint; }) {
      const messageBody = beginCell()
        .storeUint(21, 32)
        .storeUint(Math.floor(Math.random() * Math.pow(2, 31)), 64)
        .storeAddress(params.toAddress)
        .storeCoins(toNano(0.2))
        .storeRef(beginCell()
            .storeUint(0x178d4519, 32)
            .storeUint(0, 64)
            .storeCoins(params.jettonAmount)
            .storeAddress(params.fromAddress || null)
            .storeAddress(params.responseAddress || null)
            .storeCoins(params.forwardTonAmount || 0)
            .storeUint(0, 1)
            .endCell())
      .endCell();
      await provider.internal(via, {
        value: "0.2", // send 0.002 TON for gas
        body: messageBody
    });
    }

    async mint(provider: ContractProvider, via: Sender, params: { toAddress: Address; jettonAmount: bigint; fromAddress?: Address; responseAddress?: Address; forwardTonAmount?: bigint; }) {  
      const messageBody = beginCell()
        .storeUint(21, 32)
        .storeUint(Math.floor(Math.random() * Math.pow(2, 31)), 64)
        .storeAddress(params.toAddress)
        .storeCoins(toNano(0.2))
        .storeRef(beginCell()
            .storeUint(0x178d4519, 32)
            .storeUint(0, 64)
            .storeCoins(params.jettonAmount)
            .storeAddress(params.fromAddress || null)
            .storeAddress(params.responseAddress || null)
            .storeCoins(params.forwardTonAmount || 0)
            .storeUint(0, 1)
            .endCell())
      .endCell();
      await provider.internal(via, {
        value: "0.2", // send 0.002 TON for gas
        body: messageBody
    });
  }
    
  async changeAdmin(provider: ContractProvider, via: Sender, params: { newAdmin: Address }) {
    const messageBody = beginCell()
      .storeAddress(params.newAdmin)
      .endCell();
    await provider.internal(via, {
      value: "0.002", // send 0.002 TON for gas
      body: messageBody
    });
  }
  async get_jetton_data(provider: ContractProvider) {
    const { stack } = await provider.get("get_jetton_data", []);
    return stack.readBigNumber();
  }
}