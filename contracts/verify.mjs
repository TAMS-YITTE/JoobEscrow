import { ethers } from "ethers";

const addresses = [
    "0xD5B180580D183A7A9278118312207bc8a9C9f89E",
    "0xa45f887b938a08B295A5b96b6559600632F09Ab0",
    "0x56c2227E06dBC16062179Be397839b101a8e58c7",
    "0x3EEEA456daCF2247CB0023a70923E60C3E13D6C3",
    "0x7986Bd37C4DA6d1822958fCB97E7a284b40DD7Cc",
    "0x96c38901e9b4608C6F4181dbF5da024047D13e7C", // Fallback
    "0xE5191bBFbe0E04956C9611CEF4dF6E10eFb79B70" // USDT
];

const abi = [
    "function defaultFeeBPS() view returns (uint256)",
    "function owner() view returns (address)",
    "function feeRecipient() view returns (address)",
    "function symbol() view returns (string)" // for token
];

const mainnetRpc = "https://bsc-dataseed.binance.org/";
const testnetRpc = "https://data-seed-prebsc-1-s1.binance.org:8545/";

async function checkNetwork(rpcUrl, name) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log(`\n--- Checking on ${name} ---`);
    for (const addr of addresses) {
        const code = await provider.getCode(addr);
        if (code === "0x") {
            console.log(`[${addr}] Not deployed`);
            continue;
        }
        
        const contract = new ethers.Contract(addr, abi, provider);
        try {
            // Is it escrow?
            const fee = await contract.defaultFeeBPS();
            const owner = await contract.owner();
            const recipient = await contract.feeRecipient();
            console.log(`[${addr}] ESCROW | Fee: ${Number(fee)/100}% | Owner: ${owner} | Treasury: ${recipient}`);
        } catch (e) {
            try {
                // Is it token?
                const sym = await contract.symbol();
                console.log(`[${addr}] TOKEN | Symbol: ${sym}`);
            } catch(e2) {
                console.log(`[${addr}] DEPLOYED but unknown ABI`);
            }
        }
    }
}

async function main() {
    await checkNetwork(mainnetRpc, "BSC MAINNET");
    await checkNetwork(testnetRpc, "BSC TESTNET");
}

main().catch(console.error);
