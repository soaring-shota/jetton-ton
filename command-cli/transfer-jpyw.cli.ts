import { program } from 'commander';
import { transferJpyw } from '../typescript/transfer_tonclient';

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
    console.log("xxxxxx", toAddress);
    console.log("yyyyyy", amount);
    const toJettonAddress = await transferJpyw({amount: BigInt(amount), toAddress: toAddress});
}

exec();