import { toNano } from '@ton/core';
import { Jpyw } from '../wrappers/Jpyw';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jpyw = provider.open(Jpyw.createFromConfig({}, await compile('Jpyw')));

    await jpyw.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(jpyw.address);

    // run methods on `jpyw`
}
