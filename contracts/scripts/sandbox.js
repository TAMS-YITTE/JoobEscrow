import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hre from "hardhat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const { ethers } = hre;
    const signers = await ethers.getSigners();
    const [owner, client, provider, treasury] = signers;
    
    console.log("==========================================");
    console.log("        JOOB ESCROW - SANDBOX DEPLOY      ");
    console.log("==========================================");

    // 1. Deploy
    const MockUSDT = await ethers.getContractFactory("MockStandardToken");
    const usdt = await MockUSDT.deploy("Mock USDT", "USDT");
    await usdt.waitForDeployment();
    const usdtAddress = await usdt.getAddress();
    
    const Escrow = await ethers.getContractFactory("UniversalServiceEscrow");
    const escrow = await Escrow.deploy(treasury.address, 800); // 8% fee
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    
    // 2. Setup
    const decimals = 18;
    await escrow.setTokenAllowed(usdtAddress, "USDT", ethers.parseUnits("1", decimals), ethers.parseUnits("100000", decimals), true);
    
    console.log(`\n✅ Deployed Mock USDT at: ${usdtAddress}`);
    console.log(`✅ Deployed Escrow at:    ${escrowAddress}`);

    // 3. Fund Accounts
    const fundAmount = ethers.parseUnits("10000", decimals);
    
    let accountsToFund = [client.address, provider.address];
    if (process.env.SANDBOX_FUND_ADDRESSES) {
        const customAddrs = process.env.SANDBOX_FUND_ADDRESSES.split(',').map(a => a.trim());
        accountsToFund = accountsToFund.concat(customAddrs);
    }
    
    console.log(`\n💰 Funding accounts with 10,000 USDT and 10 ETH each...`);
    for (const addr of accountsToFund) {
        await usdt.transfer(addr, fundAmount);
        await owner.sendTransaction({ to: addr, value: ethers.parseEther("10.0") });
        const ethBal = await ethers.provider.getBalance(addr);
        const usdtBal = await usdt.balanceOf(addr);
        console.log(` - Funded: ${addr} | ETH: ${ethers.formatEther(ethBal)} | USDT: ${ethers.formatUnits(usdtBal, decimals)}`);
    }

    // 4. Update Frontend Configs via .env.local
    console.log("\n📝 Updating Frontend configs (.env.local)...");
    
    const envLocalPath = path.resolve(__dirname, "../../frontend/.env.local");
    let envLocalContent = "";
    if (fs.existsSync(envLocalPath)) {
        envLocalContent = fs.readFileSync(envLocalPath, "utf8");
    }
    
    // Remove old deployed addresses if present
    envLocalContent = envLocalContent.replace(/^NEXT_PUBLIC_ESCROW_ADDRESS=.*(\r?\n)?/gm, "");
    envLocalContent = envLocalContent.replace(/^NEXT_PUBLIC_USDT_ADDRESS=.*(\r?\n)?/gm, "");
    
    // Append new addresses
    envLocalContent += `\nNEXT_PUBLIC_ESCROW_ADDRESS=${escrowAddress}`;
    envLocalContent += `\nNEXT_PUBLIC_USDT_ADDRESS=${usdtAddress}\n`;
    
    fs.writeFileSync(envLocalPath, envLocalContent.trim() + "\n");
    console.log(` - Updated frontend/.env.local with new contract addresses`);

    console.log("\n🔑 Test Hardhat Keys (for MetaMask Import):");
    console.log(`Client   (${client.address}): 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`);
    console.log(`Provider (${provider.address}): 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`);
    console.log(`Treasury (${treasury.address}): 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`);
    console.log("\n🚀 SANDBOX READY!");
}

main().then(() => process.exit(0)).catch(console.error);
