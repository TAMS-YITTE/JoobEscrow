// Deploiement de l'instance DEMO "Try it with $1" de la V4 (meme bytecode audite).
//
//   npx hardhat run scripts/deployDemo.js --config hardhat.demo.config.js --network bscmainnet
//   FORK=1 npx hardhat run scripts/deployDemo.js --config hardhat.demo.config.js   (repetition sur fork BSC)
//   SIM=1  npx hardhat run scripts/deployDemo.js --config hardhat.demo.config.js   (simulation locale chainId 56,
//          jetons factices places aux vraies adresses — quand aucun RPC ne permet le fork)
//
// Etapes : deploiement (commission 0 %, recipient = Safe) -> USDT seul, borne 1..20 USDT
// -> BUSD/USDC/WBNB retires -> transferOwnership(Safe) (Ownable2Step : le Safe doit
// ensuite executer acceptOwnership, lot Safe genere par ce script).
// Sur fork : simule aussi acceptOwnership par le Safe et un cycle complet de demo.
import hardhat from "hardhat";
import fs from "fs";
const { ethers, network } = hardhat;

const SAFE = "0x872F979aa868145bE3c3A6EA787614BE2A18C7f7";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const REMOVE = {
  BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
};
const MIN = ethers.parseUnits("1", 18);
const MAX = ethers.parseUnits("20", 18);
const FORK = network.name === "hardhat";

function check(ok, label) {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}`);
  if (!ok) throw new Error(`Check failed: ${label}`);
}

// ── Simulation locale : code ERC20 factice aux adresses BUSD/USDT/USDC/WBNB ──
const SIM_WHALE = "0x00000000000000000000000000000000000beef1";
async function installMockTokens() {
  const Mock = await ethers.getContractFactory("MockStandardToken");
  const mock = await Mock.deploy("Mock", "MOCK");
  await mock.waitForDeployment();
  const code = await ethers.provider.getCode(await mock.getAddress());
  const pad = (v) => ethers.zeroPadValue(ethers.toBeHex(v), 32);
  const supply = ethers.parseUnits("1000000000", 18);
  // OpenZeppelin ERC20 v5 : _balances au slot 0, _totalSupply au slot 2.
  const balSlot = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [SIM_WHALE, 0]));
  for (const token of [USDT, ...Object.values(REMOVE)]) {
    await network.provider.send("hardhat_setCode", [token, code]);
    await network.provider.send("hardhat_setStorageAt", [token, pad(2), pad(supply)]);
    await network.provider.send("hardhat_setStorageAt", [token, balSlot, pad(supply)]);
  }
}

async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  check(chainId === 56n, `chainId 56 (${FORK ? "fork" : network.name})`);

  if (process.env.SIM) await installMockTokens();

  let deployer;
  if (FORK) {
    [deployer] = await ethers.getSigners();
  } else {
    [deployer] = await ethers.getSigners();
    const bal = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer ${deployer.address} — ${ethers.formatEther(bal)} BNB`);
    check(bal > ethers.parseEther("0.003"), "deployer has gas");
  }

  const Escrow = await ethers.getContractFactory("UniversalServiceEscrow", deployer);
  const escrow = await Escrow.deploy(SAFE, 0);
  await escrow.waitForDeployment();
  const addr = await escrow.getAddress();
  console.log(`Demo escrow deployed: ${addr}`);

  await (await escrow.setTokenAllowed(USDT, "USDT", MIN, MAX, true)).wait();
  for (const [sym, token] of Object.entries(REMOVE)) {
    if ((await escrow.tokenConfigs(token)).allowed) {
      await (await escrow.setTokenAllowed(token, sym, 0, 0, false)).wait();
    }
  }
  await (await escrow.transferOwnership(SAFE)).wait();

  // ── Controles post-deploiement ──────────────────────────────────────────
  const usdt = await escrow.tokenConfigs(USDT);
  check(usdt.allowed && usdt.minAmount === MIN && usdt.maxAmount === MAX, "USDT allowed, 1..20 USDT");
  for (const [sym, token] of Object.entries(REMOVE)) {
    check(!(await escrow.tokenConfigs(token)).allowed, `${sym} not allowed`);
  }
  check((await escrow.defaultFeeBPS()) === 0n, "fee 0 %");
  check((await escrow.feeRecipient()) === SAFE, "feeRecipient = Safe");
  check((await escrow.pendingOwner()) === SAFE, "pendingOwner = Safe (acceptOwnership a signer)");

  // ── Lot Safe : acceptOwnership ──────────────────────────────────────────
  const batch = {
    version: "1.0",
    chainId: "56",
    createdAt: Date.now(),
    meta: {
      name: "JoobEscrow Demo Escrow - Accept ownership",
      description: `Safe accepts ownership of the demo escrow instance ${addr} (Ownable2Step).`,
      txBuilderVersion: "1.18.0",
      createdFromSafeAddress: SAFE,
      createdFromOwnerAddress: "",
    },
    transactions: [{ to: addr, value: "0", data: escrow.interface.encodeFunctionData("acceptOwnership"), contractMethod: null, contractInputsValues: null }],
  };

  if (!FORK) {
    fs.mkdirSync("delivery/safe", { recursive: true });
    fs.writeFileSync("delivery/safe/safe-demo-accept-ownership.json", JSON.stringify(batch, null, 2));
    fs.writeFileSync("delivery/demo-escrow.json", JSON.stringify({ demoEscrow: addr, deployTx: escrow.deploymentTransaction().hash }, null, 2));
    console.log("\nSafe batch: delivery/safe/safe-demo-accept-ownership.json");
    console.log(`Verify: npx hardhat verify --config hardhat.demo.config.js --network bscmainnet ${addr} ${SAFE} 0`);
    return;
  }

  // ── Fork uniquement : acceptOwnership par le Safe + cycle complet de demo ─
  await network.provider.request({ method: "hardhat_impersonateAccount", params: [SAFE] });
  await network.provider.send("hardhat_setBalance", [SAFE, "0x56BC75E2D63100000"]);
  const safe = await ethers.getSigner(SAFE);
  await (await escrow.connect(safe).acceptOwnership()).wait();
  check((await escrow.owner()) === SAFE, "owner = Safe after acceptOwnership");

  const [, clientW, providerW] = await ethers.getSigners();
  // USDT de test : preleves chez un gros detenteur imperson ne (aucun effet reel).
  const WHALE = process.env.SIM ? SIM_WHALE : (process.env.USDT_WHALE || "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3");
  const usdtC = await ethers.getContractAt(["function transfer(address,uint256) returns (bool)", "function approve(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"], USDT);
  await network.provider.request({ method: "hardhat_impersonateAccount", params: [WHALE] });
  await network.provider.send("hardhat_setBalance", [WHALE, "0x56BC75E2D63100000"]);
  check((await usdtC.balanceOf(WHALE)) >= MAX * 2n, "fork: test USDT available");
  await (await usdtC.connect(await ethers.getSigner(WHALE)).transfer(clientW.address, MAX * 2n)).wait();

  const before = await usdtC.balanceOf(clientW.address);
  await (await usdtC.connect(clientW).approve(addr, MIN)).wait();
  const tx = await escrow.connect(clientW).createAndFundEscrow(providerW.address, USDT, MIN, 3);
  const rc = await tx.wait();
  const id = await escrow.escrowCounter();
  await (await escrow.connect(providerW).acceptEscrow(id)).wait();
  await (await escrow.connect(clientW).releaseFunds(id)).wait();
  await (await escrow.connect(providerW).withdraw(USDT)).wait();
  check((await usdtC.balanceOf(providerW.address)) === MIN, "provider received exactly 1 USDT (0 % fee)");
  check((await usdtC.balanceOf(clientW.address)) === before - MIN, "client debited exactly 1 USDT");
  check(rc.status === 1, "demo cycle complete");

  let reverted = false;
  await (await usdtC.connect(clientW).approve(addr, MAX + 1n)).wait();
  try { await escrow.connect(clientW).createAndFundEscrow(providerW.address, USDT, MAX + 1n, 3); } catch { reverted = true; }
  check(reverted, "deposit above 20 USDT rejected");
  console.log("\nFork rehearsal passed.");
}

main().catch((e) => { console.error(e.message || e); process.exitCode = 1; });
