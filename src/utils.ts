import { Connection, Keypair } from '@solana/web3.js';
import configJson from '../configSolana.json';
import { readFileSync } from 'fs';
import { base58 } from "ethers/lib/utils"

const key = readFileSync('privatekey.txt', 'utf8');
export const payer = Keypair.fromSecretKey(base58.decode(key));

export const config = {
    oftProgramId: configJson.oftProgramId,
    oftConfigKey: configJson.oftConfigKey,
    mint: configJson.mint,
    rpcUrl: configJson.rpcUrl,
    escrowKey: configJson.escrowKey,
}

export const connection = new Connection(config.rpcUrl, "confirmed");

// get payer balance
export async function getPayerBalance() {
    const balance = await connection.getBalance(payer.publicKey);
    console.log('Payer balance:', balance);
}

export function hexStringToUint8Array(hexString: string): Uint8Array {
    // Remove the optional "0x" prefix
    if (hexString.startsWith('0x')) {
        hexString = hexString.slice(2);
    }

    // Ensure the string length is even
    if (hexString.length % 2 !== 0) {
        throw new Error("Hex string must have an even length");
    }

    // Convert the hex string to a Uint8Array
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        byteArray[i / 2] = parseInt(hexString.slice(i, i + 2), 16);
    }

    const length = byteArray.length
    if (length > 32) {
        throw new Error("Hex string must have a length of 32");
    }
    const padding = new Uint8Array(32 - length)
    const byteArray32 = new Uint8Array(32)
    byteArray32.set(padding, 0)
    byteArray32.set(byteArray, 32 - length)

    return byteArray32;
}