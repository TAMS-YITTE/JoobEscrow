import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactPath = path.resolve(__dirname, "../artifacts/src/UniversalServiceEscrow.sol/UniversalServiceEscrow.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

const ESCROW_ADDRESS = "0x96c38901e9b4608C6F4181dbF5da024047D13e7C";
const USDT_ADDRESS = "0xE5191bBFbe0E04956C9611CEF4dF6E10eFb79B70"; // BSC Testnet USDT mock

const fileContent = `// Automatically updated with latest V4 ABI and Testnet address
export const ESCROW_ADDRESS = "${ESCROW_ADDRESS}";
export const USDT_ADDRESS = "${USDT_ADDRESS}";

export const ESCROW_ABI = ${JSON.stringify(artifact.abi, null, 2)};

export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_spender", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {"name": "_owner", "type": "address"},
      {"name": "_spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  }
];
`;

const destPath = path.resolve(__dirname, "../../frontend/src/config/contract.js");
fs.writeFileSync(destPath, fileContent);

console.log("Frontend config successfully updated with V4 ABI and Testnet addresses.");
