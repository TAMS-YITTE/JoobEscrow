import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const ESCROW_ADDRESS = "0x96c38901e9b4608C6F4181dbF5da024047D13e7C";
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Mock USDT with account:", deployer.address);

  // Deploying the MockStandardToken from Mocks.sol
  const MockToken = await ethers.getContractFactory("MockStandardToken");
  const token = await MockToken.deploy("Test USDT", "USDT", { gasPrice: ethers.parseUnits("30", "gwei") });
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  
  console.log("Mock USDT deployed to:", tokenAddress);
  console.log("Deployer balance:", ethers.formatEther(await token.balanceOf(deployer.address)));

  console.log("Whitelisting new USDT on Escrow...");
  const Escrow = await ethers.getContractFactory("UniversalServiceEscrow");
  const escrow = Escrow.attach(ESCROW_ADDRESS);

  const tx = await escrow.setTokenAllowed(
    tokenAddress,
    "USDT",
    ethers.parseUnits("1", 18),       
    ethers.parseUnits("1000000", 18), 
    true
  );
  await tx.wait();
  console.log("✅ New USDT whitelisted!");

  // Update updateFrontend.js to use the new token
  const updateScriptPath = path.resolve(__dirname, "updateFrontend.js");
  let scriptContent = fs.readFileSync(updateScriptPath, "utf8");
  scriptContent = scriptContent.replace(/const USDT_ADDRESS = "0x[a-fA-F0-9]{40}";\s*\/\/\s*BSC Testnet USDT mock/, `const USDT_ADDRESS = "${tokenAddress}"; // BSC Testnet USDT mock`);
  fs.writeFileSync(updateScriptPath, scriptContent);
  console.log("updateFrontend.js updated with new USDT address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
