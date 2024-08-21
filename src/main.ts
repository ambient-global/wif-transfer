import { transfer } from "./transfer"
import { payer } from "./utils"

const main = async () => {

    // amount in wif
    const amountIn = 0.01
    // address to send to on Ethereum
    const ethTo = '0x614721CC7B47e58b0355977280DbA1663447C5F5'

    await transfer(payer, amountIn, ethTo)
}

main()