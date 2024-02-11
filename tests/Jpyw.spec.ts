import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Jpyw } from '../wrappers/Jpyw';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Jpyw', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Jpyw');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jpyw: SandboxContract<Jpyw>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        jpyw = blockchain.openContract(Jpyw.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await jpyw.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jpyw.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jpyw are ready to use
    });
});
