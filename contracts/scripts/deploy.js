import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying EscrowX with the account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  // By default, the fee recipient is the deployer, unless specified in .env
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS || deployer.address;

  const Escrow = await ethers.getContractFactory("UniversalServiceEscrow");

  // The 5 fee tiers for Joob Escrow
  const feeTiers = [1000, 800, 500, 300, 200];
  const deployedAddresses = {};

  console.log("----------------------------------------------------");
  for (let fee of feeTiers) {
    console.log(`Deploying contract with ${fee / 100}% fee...`);
    const escrow = await Escrow.deploy(feeRecipient, fee);
    await escrow.waitForDeployment();
    const address = await escrow.getAddress();
    deployedAddresses[fee] = address;
    console.log(`✅ Escrow (${fee / 100}%): ${address}`);
  }
  console.log("----------------------------------------------------");
  
  console.log("\nFee Recipient set to:", feeRecipient);
  console.log("\nTo verify the contracts on BscScan, run these commands in your terminal:");
  for (let fee of feeTiers) {
    console.log(`npx hardhat verify --network bscmainnet ${deployedAddresses[fee]} ${feeRecipient} ${fee}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
