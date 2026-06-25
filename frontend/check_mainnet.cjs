const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  const addresses = {
    "USDT": "0x55d398326f99059fF775485246999027B3197955",
    "CONTRACT_10_PERCENT": "0xD5B180580D183A7A9278118312207bc8a9C9f89E",
    "CONTRACT_8_PERCENT": "0xa45f887b938a08B295A5b96b6559600632F09Ab0",
    "CONTRACT_5_PERCENT": "0x56c2227E06dBC16062179Be397839b101a8e58c7",
    "CONTRACT_3_PERCENT": "0x3EEEA456daCF2247CB0023a70923E60C3E13D6C3",
    "CONTRACT_2_PERCENT": "0x7986Bd37C4DA6d1822958fCB97E7a284b40DD7Cc",
    "SANDBOX_ADDRESS (from .env.local)": "0x96c38901e9b4608C6F4181dbF5da024047D13e7C"
  };

  console.log("Checking BSC Mainnet...");
  for (const [name, address] of Object.entries(addresses)) {
    try {
      const code = await provider.getCode(address);
      if (code === '0x') {
        console.log(`[MISSING] ${name} (${address}) is NOT deployed on BSC Mainnet.`);
      } else {
        console.log(`[OK]      ${name} (${address}) is deployed.`);
      }
    } catch (e) {
      console.log(`[ERROR]   Could not check ${name}: ${e.message}`);
    }
  }
}

main();
