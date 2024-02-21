import { program } from 'commander';
import { mintJpyw } from '../typescript/mint_tonclient';

program
  .option('--toAddress <string>', 'Destination address for minted jettons')
  .option('--amount <string>', 'amount to mint');

program.parse();

const { toAddress, amount } = program.opts();

const exec = async () => {
    if (!toAddress) {
        console.error("required argument '--toAddress <string>' not specified");
        process.exit(1);
    }

    if (!amount) {
        console.error("required argument '--amount <string>' not specified");
        process.exit(1);
    }
 
    const toJettonAddress = await mintJpyw({mintAmount: BigInt(amount), toAddress: toAddress});
}

exec();