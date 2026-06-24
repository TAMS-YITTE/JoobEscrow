import hre from "hardhat";

async function main() {
    const { ethers } = hre;
    const [owner, client, provider, treasury] = await ethers.getSigners();
    
    console.log("==========================================");
    console.log("   JOOB ESCROW - FULL ON-CHAIN SIMULATION  ");
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
    
    const initialAmount = ethers.parseUnits("1000", decimals);
    await usdt.transfer(client.address, initialAmount);
    
    console.log("\n✅ Setup complete. USDT and Escrow deployed.");

    async function printBalances(label) {
        const clientBal = await usdt.balanceOf(client.address);
        const providerBal = await usdt.balanceOf(provider.address);
        const treasuryBal = await usdt.balanceOf(treasury.address);
        const escrowBal = await usdt.balanceOf(escrowAddress);
        console.log(`[${label}] Client: ${ethers.formatUnits(clientBal, decimals)} | Provider: ${ethers.formatUnits(providerBal, decimals)} | Treasury: ${ethers.formatUnits(treasuryBal, decimals)} | Escrow: ${ethers.formatUnits(escrowBal, decimals)}`);
    }

    await printBalances("INITIAL");

    // SCENARIO A: Happy Path
    console.log("\n--- SCÉNARIO A : Cycle Parfait ---");
    let amount = ethers.parseUnits("100", decimals);
    await usdt.connect(client).approve(escrowAddress, amount);
    await escrow.connect(client).createAndFundEscrow(provider.address, usdtAddress, amount, 7);
    let escrowId = 1;
    
    await escrow.connect(provider).acceptEscrow(escrowId);
    await escrow.connect(client).releaseFunds(escrowId);
    
    await escrow.connect(provider).withdraw(usdtAddress);
    await escrow.connect(treasury).withdraw(usdtAddress);
    
    await printBalances("SCENARIO A END");
    
    let providerBal = await usdt.balanceOf(provider.address);
    let treasuryBal = await usdt.balanceOf(treasury.address);
    let expectedFee = (amount * 800n) / 10000n;
    let expectedProvider = amount - expectedFee;
    
    if (providerBal !== expectedProvider) {
        console.error("❌ Scenario A: Provider balance incorrect!");
        process.exit(1);
    }
    if (treasuryBal !== expectedFee) {
        console.error("❌ Scenario A: Treasury balance incorrect!");
        process.exit(1);
    }
    console.log("✅ SCENARIO A PASSED");

    // SCENARIO B: Dispute 50/50
    console.log("\n--- SCÉNARIO B : Litige résolu 50/50 ---");
    amount = ethers.parseUnits("200", decimals);
    await usdt.connect(client).approve(escrowAddress, amount);
    await escrow.connect(client).createAndFundEscrow(provider.address, usdtAddress, amount, 7);
    escrowId = 2;
    
    await escrow.connect(provider).acceptEscrow(escrowId);
    
    const evidenceHash = ethers.id("fake_evidence");
    await escrow.connect(client).openDispute(escrowId, evidenceHash);
    
    await escrow.connect(owner).resolveDispute(escrowId, 5000);
    
    await escrow.connect(provider).withdraw(usdtAddress);
    await escrow.connect(client).withdraw(usdtAddress);
    await escrow.connect(treasury).withdraw(usdtAddress);
    
    await printBalances("SCENARIO B END");
    
    let providerBalB = await usdt.balanceOf(provider.address);
    let treasuryBalB = await usdt.balanceOf(treasury.address);
    let clientBalB = await usdt.balanceOf(client.address);
    
    let expectedProviderShareB = amount / 2n;
    let expectedClientShareB = amount - expectedProviderShareB;
    let expectedFeeB = (expectedProviderShareB * 800n) / 10000n;
    let expectedProviderNetB = expectedProviderShareB - expectedFeeB;
    
    if (providerBalB !== expectedProvider + expectedProviderNetB) {
        console.error("❌ Scenario B: Provider balance incorrect!");
        process.exit(1);
    }
    if (treasuryBalB !== expectedFee + expectedFeeB) {
         console.error("❌ Scenario B: Treasury balance incorrect!");
         process.exit(1);
    }
    let expectedClientBalAfterB = initialAmount - ethers.parseUnits("300", decimals) + expectedClientShareB;
    if (clientBalB !== expectedClientBalAfterB) {
        console.error(`❌ Scenario B: Client balance incorrect!`);
        process.exit(1);
    }
    console.log("✅ SCENARIO B PASSED");

    // SCENARIO C: Timeout
    console.log("\n--- SCÉNARIO C : Timeout ---");
    amount = ethers.parseUnits("50", decimals);
    await usdt.connect(client).approve(escrowAddress, amount);
    await escrow.connect(client).createAndFundEscrow(provider.address, usdtAddress, amount, 7);
    escrowId = 3;
    
    await escrow.connect(provider).acceptEscrow(escrowId);
    
    await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    
    await escrow.connect(provider).claimTimeout(escrowId);
    
    await escrow.connect(provider).withdraw(usdtAddress);
    await escrow.connect(treasury).withdraw(usdtAddress);
    
    await printBalances("SCENARIO C END");
    
    let providerBalC = await usdt.balanceOf(provider.address);
    let expectedFeeC = (amount * 800n) / 10000n;
    let expectedProviderNetC = amount - expectedFeeC;
    
    if (providerBalC !== providerBalB + expectedProviderNetC) {
        console.error("❌ Scenario C: Provider balance incorrect!");
        process.exit(1);
    }
    console.log("✅ SCENARIO C PASSED");
    
    console.log("\n🚀 TOUTES LES SIMULATIONS ONT REUSSI !");
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
