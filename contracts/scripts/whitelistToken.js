import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const ESCROW_ADDRESS = "0x96c38901e9b4608C6F4181dbF5da024047D13e7C";
  const USDT_ADDRESS = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

  const Escrow = await ethers.getContractFactory("UniversalServiceEscrow");
  const escrow = Escrow.attach(ESCROW_ADDRESS);

  console.log("Whitelisting USDT on the deployed Escrow...");
  const tx = await escrow.setTokenAllowed(
    USDT_ADDRESS,
    "USDT",
    ethers.parseUnits("1", 18),       // Min amount: 1 USDT
    ethers.parseUnits("1000000", 18), // Max amount: 1M USDT
    true
  );

  console.log("Transaction sent! Hash:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  console.log("✅ USDT successfully whitelisted!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
