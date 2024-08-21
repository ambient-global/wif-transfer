# WIF-Transfer
This is a simple script for transferring WIF from Sol to Base

## Dependencies
- `yarn`

## Setup
- (Optional for security) Create a new throwaway private key and fund the address with Sol
- Create a file called `privatekey.json` at the top level directory with your Solana private key in byte-array form
- Modify the amount and Ethereum destination address in `main.ts`

## Running
Run the program with
```yarn start```