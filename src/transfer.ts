import { config, connection, hexStringToUint8Array } from "./utils"
import { OftPDADeriver, OftProgram, OftTools, SendHelper } from '@layerzerolabs/lz-solana-sdk-v2'
import { Options } from '@layerzerolabs/lz-v2-utilities'
import { getMint, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js"
import { hexlify } from 'ethers/lib/utils'

export const transfer = async (sender: Keypair, amountIn: number, ethTo: string) => {

    const targetEid = 30184

    const senderMintAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        sender,
        new PublicKey(config.mint),
        sender.publicKey
      );
    
    const mintInfo = await getMint(
        connection,
        new PublicKey(config.mint),
      );
    
    const amount = amountIn * 10 ** mintInfo.decimals
    const deriver = new OftPDADeriver(new PublicKey(config.oftProgramId))
    const [peer] = deriver.peer(new PublicKey(config.oftConfigKey), targetEid)
    const peerInfo = await OftProgram.accounts.Peer.fromAccountAddress(connection, peer)

    const helper = new SendHelper()

    const accounts = await helper.getQuoteAccounts(
        connection,
        sender.publicKey,
        new PublicKey(config.oftConfigKey),
        targetEid,
        hexlify(peerInfo.address)
    )

    const ethRecipient = Array.from(hexStringToUint8Array(ethTo))

    const fees =  await OftTools.quoteWithUln(
        connection,
        sender.publicKey,
        new PublicKey(config.mint),
        targetEid,
        BigInt(amount),
        (BigInt(amount) * BigInt(9)) / BigInt(10),
        Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(), // any extra execution options to add on top of enforced,
        ethRecipient,
        false,
        new PublicKey(config.escrowKey),
        undefined, // composeMsg
        peerInfo.address,
        accounts,
        TOKEN_PROGRAM_ID, // SPL Token Program
        new PublicKey(config.oftProgramId) // Your OFT Program
    )

    console.log('fees: ', fees)
    fees.nativeFee *= BigInt(2)
    console.log('fees: ', fees)

    const ix1 = await OftTools.sendWithUln(
        connection,
        sender.publicKey,
        new PublicKey(config.mint),
        senderMintAccount.address,
        targetEid,
        BigInt(amount),
        (BigInt(amount) * BigInt(9)) / BigInt(10),
        Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(), // any extra execution options to add on top of enforced,
        ethRecipient,
        fees.nativeFee,
        fees.lzTokenFee,
        new PublicKey(config.escrowKey),
        undefined, // composeMsg
        peerInfo.address,
        undefined,
        TOKEN_PROGRAM_ID, // SPL Token Program
        new PublicKey(config.oftProgramId) // Your OFT Program
    )

    let transaction = new Transaction();
    // Request more compute units
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
    });
    transaction.add(modifyComputeUnits);
    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100000
      });
    transaction.add(addPriorityFee)
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.add(ix1).sign(sender)

    const tx = await sendAndConfirmTransaction(
        connection,
        transaction,
        [sender],
        { commitment: `confirmed` }
    )
    console.log('transaction: ', tx)
}