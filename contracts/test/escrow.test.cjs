const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const E = (n) => ethers.parseEther(String(n));
const DAY = 24 * 60 * 60;

async function deployFixture() {
  const [owner, feeRecipient, client, provider, client2, randomUser] = await ethers.getSigners();

  const usdt    = await (await ethers.getContractFactory("MockNoReturnUSDT")).connect(owner).deploy();
  const feeTok  = await (await ethers.getContractFactory("MockFeeOnTransferToken")).connect(owner).deploy();
  const flaky   = await (await ethers.getContractFactory("MockFlakyToken")).connect(owner).deploy();
  const std     = await (await ethers.getContractFactory("MockStandardToken")).connect(owner).deploy("Std", "STD");

  const escrow = await (await ethers.getContractFactory("UniversalServiceEscrow"))
    .connect(owner).deploy(feeRecipient.address);

  const eAddr = await escrow.getAddress();
  for (const [t, sym] of [[usdt, "USDT"], [feeTok, "FEE"], [flaky, "FLKY"]]) {
    await escrow.connect(owner).setTokenAllowed(await t.getAddress(), sym, E(1), E(100000), true);
  }

  // distribute + approve
  for (const t of [usdt, feeTok, flaky]) {
    await t.connect(owner).transfer(client.address, E(100000));
    await t.connect(client).approve(eAddr, ethers.MaxUint256);
  }
  await usdt.connect(owner).transfer(client2.address, E(100000));
  await usdt.connect(client2).approve(eAddr, ethers.MaxUint256);

  return { escrow, eAddr, usdt, feeTok, flaky, std, owner, feeRecipient, client, provider, client2, randomUser };
}

const wd = (escrow, u, t) => escrow.withdrawable(u, t);

describe("UniversalServiceEscrow", () => {

  describe("1. Happy path", () => {
    it("create → accept → release → withdraw (non-return USDT)", async () => {
      const { escrow, usdt, client, provider, feeRecipient } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(1000), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).releaseFunds(1);

      expect(await wd(escrow, provider.address, u)).to.equal(E(920));
      expect(await wd(escrow, feeRecipient.address, u)).to.equal(E(80));

      await escrow.connect(provider).withdraw(u);
      expect(await usdt.balanceOf(provider.address)).to.equal(E(920));
      await escrow.connect(feeRecipient).withdraw(u);
      expect(await usdt.balanceOf(feeRecipient.address)).to.equal(E(80));
    });
  });

  describe("2. Cancellation", () => {
    it("cancel before acceptance refunds full, no fee", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(500), 30);
      await escrow.connect(client).cancelEscrow(1);
      expect(await wd(escrow, client.address, u)).to.equal(E(500));
      expect(await wd(escrow, provider.address, u)).to.equal(0n);
    });
    it("cancel after acceptance reverts", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(500), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await expect(escrow.connect(client).cancelEscrow(1)).to.be.revertedWith("Cannot cancel");
    });
  });

  describe("3. Timeout claim (requires acceptance)", () => {
    it("reverts without acceptance, then works once accepted", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(1000), 30);
      await time.increase(31 * DAY);
      await expect(escrow.connect(provider).claimTimeout(1)).to.be.revertedWith("Provider never accepted");
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(provider).claimTimeout(1);
      expect(await wd(escrow, provider.address, u)).to.equal(E(920));
    });
    it("reverts before deadline", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(1000), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await expect(escrow.connect(provider).claimTimeout(1)).to.be.revertedWith("Timeout not reached");
    });
  });

  describe("4. Dispute resolution (owner split)", () => {
    it("30% provider split, fee only on provider portion", async () => {
      const { escrow, usdt, owner, client, provider, feeRecipient } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(1000), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).openDispute(1, ethers.id("evidence1"));
      expect(await escrow.disputeOpener(1)).to.equal(client.address);
      await escrow.connect(provider).submitEvidence(1, ethers.id("evidence2"));
      await escrow.connect(owner).resolveDispute(1, 3000);
      expect(await wd(escrow, provider.address, u)).to.equal(E(276));
      expect(await wd(escrow, client.address, u)).to.equal(E(700));
      expect(await wd(escrow, feeRecipient.address, u)).to.equal(E(24));
    });
  });

  describe("5. Stale dispute (50/50, unbiased)", () => {
    it("client opens → 50/50", async () => {
      const { escrow, usdt, client, provider, feeRecipient } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(1000), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).openDispute(1, ethers.id("stale"));
      await time.increase(31 * DAY);
      await escrow.connect(client).resolveStaleDispute(1);
      expect(await wd(escrow, provider.address, u)).to.equal(E(460));
      expect(await wd(escrow, client.address, u)).to.equal(E(500));
      expect(await wd(escrow, feeRecipient.address, u)).to.equal(E(40));
    });
    it("provider opens → also 50/50", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(1000), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(provider).openDispute(1, ethers.id("pd"));
      await time.increase(31 * DAY);
      await escrow.connect(provider).resolveStaleDispute(1);
      expect(await wd(escrow, provider.address, u)).to.equal(E(460));
      expect(await wd(escrow, client.address, u)).to.equal(E(500));
    });
    it("reverts if not stale yet", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(1000), 30);
      await escrow.connect(client).openDispute(1, ethers.ZeroHash);
      await expect(escrow.connect(client).resolveStaleDispute(1)).to.be.revertedWith("Dispute not stale");
    });
    it("odd wei rounds to client", async () => {
      const { escrow, usdt, owner, client, provider, feeRecipient } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(owner).setTokenAllowed(u, "USDT", 1, E(1), true); // lower min
      await escrow.connect(client).createAndFundEscrow(provider.address, u, 1001, 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).openDispute(1, ethers.ZeroHash);
      await time.increase(31 * DAY);
      await escrow.connect(client).resolveStaleDispute(1);
      expect(await wd(escrow, provider.address, u)).to.equal(460n);
      expect(await wd(escrow, client.address, u)).to.equal(501n);
      expect(await wd(escrow, feeRecipient.address, u)).to.equal(40n);
    });
  });

  describe("6. Batch withdraw isolation", () => {
    it("one reverting token does not block the rest; failed one is re-credited", async () => {
      const { escrow, usdt, flaky, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress(); const f = await flaky.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(500), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).releaseFunds(1);
      await escrow.connect(client).createAndFundEscrow(provider.address, f, E(100), 30);
      await escrow.connect(provider).acceptEscrow(2);
      await escrow.connect(client).releaseFunds(2);

      await flaky.setRevert(true);
      await escrow.connect(provider).batchWithdraw([u, f]);

      expect(await usdt.balanceOf(provider.address)).to.equal(E(460));
      expect(await wd(escrow, provider.address, f)).to.equal(E(92));
      expect(await escrow.totalWithdrawable(f)).to.equal(E(100)); // 92 provider + 8 fee
    });
    it("non-standard (no-return) token withdraws fine via batch", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(1000), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).releaseFunds(1);
      await escrow.connect(provider).batchWithdraw([u]);
      expect(await usdt.balanceOf(provider.address)).to.equal(E(920));
    });
  });

  describe("7. Fee-on-transfer accounting", () => {
    it("records actual received amount (balance delta)", async () => {
      const { escrow, feeTok, client, provider } = await loadFixture(deployFixture);
      const f = await feeTok.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, f, E(1000), 30);
      const d = await escrow.getEscrowDetails(1);
      expect(d[4]).to.equal(E(970)); // 3% taken in transfer
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).releaseFunds(1);
      expect(await wd(escrow, provider.address, f)).to.equal((E(970) * 9200n) / 10000n);
    });
    it("DOCUMENTED: amount can fall below min after fee (no re-check)", async () => {
      const { escrow, feeTok, owner, client, provider } = await loadFixture(deployFixture);
      const f = await feeTok.getAddress();
      await escrow.connect(owner).setTokenAllowed(f, "FEE", E(2000), E(100000), true);
      await escrow.connect(client).createAndFundEscrow(provider.address, f, E(2000), 30);
      const d = await escrow.getEscrowDetails(1);
      expect(d[4]).to.equal(E(1940)); // below the 2000 min, but accepted
    });
  });

  describe("8. Pause mechanics", () => {
    it("blocks creation", async () => {
      const { escrow, usdt, owner, client, provider } = await loadFixture(deployFixture);
      await escrow.connect(owner).togglePause();
      await expect(escrow.connect(client).createAndFundEscrow(provider.address, await usdt.getAddress(), E(100), 30))
        .to.be.revertedWith("Contract is paused");
    });
    it("allows withdraw and dispute resolution while paused", async () => {
      const { escrow, usdt, owner, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      // happy escrow to credit provider
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).releaseFunds(1);
      // a second escrow + dispute opened BEFORE pausing (creation is gated)
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(50), 30);
      await escrow.connect(client).openDispute(2, ethers.ZeroHash);

      await escrow.connect(owner).togglePause();

      await escrow.connect(provider).withdraw(u); // withdraw not gated
      expect(await usdt.balanceOf(provider.address)).to.equal(E(92));
      await escrow.connect(owner).resolveDispute(2, 5000); // resolution not gated
    });
    it("blocks release and cancel", async () => {
      const { escrow, usdt, owner, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 30);
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(owner).togglePause();
      await expect(escrow.connect(client).releaseFunds(1)).to.be.revertedWith("Contract is paused");
      await expect(escrow.connect(client).cancelEscrow(1)).to.be.revertedWith("Contract is paused");
    });
  });

  describe("9. Timelock", () => {
    it("fee change: not before delay, applies after", async () => {
      const { escrow, owner } = await loadFixture(deployFixture);
      await escrow.connect(owner).queueDefaultFee(1000);
      await expect(escrow.connect(owner).executeDefaultFee(1000)).to.be.revertedWith("Action not ready");
      await time.increase(2 * DAY + 1);
      await escrow.connect(owner).executeDefaultFee(1000);
      expect(await escrow.defaultFeeBPS()).to.equal(1000n);
    });
    it("fee recipient via timelock", async () => {
      const { escrow, owner, client2 } = await loadFixture(deployFixture);
      await escrow.connect(owner).queueFeeRecipient(client2.address);
      await time.increase(2 * DAY + 1);
      await escrow.connect(owner).executeFeeRecipient(client2.address);
      expect(await escrow.feeRecipient()).to.equal(client2.address);
    });
    it("limits via timelock", async () => {
      const { escrow, owner } = await loadFixture(deployFixture);
      await escrow.connect(owner).queueLimits(5, 7, 180, 3600);
      await time.increase(2 * DAY + 1);
      await escrow.connect(owner).executeLimits(5, 7, 180, 3600);
      expect(await escrow.maxActiveEscrowsPerUser()).to.equal(5n);
      expect(await escrow.minTimeoutDays()).to.equal(7n);
      expect(await escrow.maxTimeoutDays()).to.equal(180n);
      expect(await escrow.acceptDelaySeconds()).to.equal(3600n);
    });
    it("stale timeout via timelock", async () => {
      const { escrow, owner } = await loadFixture(deployFixture);
      await escrow.connect(owner).queueStaleTimeout(45);
      await time.increase(2 * DAY + 1);
      await escrow.connect(owner).executeStaleTimeout(45);
      expect(await escrow.staleDisputeTimeout()).to.equal(BigInt(45 * DAY));
    });
    it("cancel queued action", async () => {
      const { escrow, owner } = await loadFixture(deployFixture);
      await escrow.connect(owner).queueDefaultFee(1500);
      const id = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string","uint256"], ["FEE", 1500]));
      await escrow.connect(owner).cancelQueuedAction(id);
      await time.increase(2 * DAY + 1);
      await expect(escrow.connect(owner).executeDefaultFee(1500)).to.be.revertedWith("Action not ready");
    });
    it("executing with different params than queued reverts (hash mismatch)", async () => {
      const { escrow, owner } = await loadFixture(deployFixture);
      await escrow.connect(owner).queueDefaultFee(1200);
      await time.increase(2 * DAY + 1);
      await expect(escrow.connect(owner).executeDefaultFee(1300)).to.be.revertedWith("Action not ready");
    });
  });

  describe("10. Access control", () => {
    it("owner-only functions reject non-owner", async () => {
      const { escrow, usdt, client, randomUser } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await expect(escrow.connect(client).resolveDispute(1, 5000))
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount").withArgs(client.address);
      await expect(escrow.connect(client).recoverStuckTokens(u, client.address, 0))
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount").withArgs(client.address);
      await expect(escrow.connect(randomUser).togglePause())
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount").withArgs(randomUser.address);
      await expect(escrow.connect(randomUser).queueDefaultFee(500))
        .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount").withArgs(randomUser.address);
    });
    it("non-party cannot open/submit/stale-resolve", async () => {
      const { escrow, usdt, client, provider, randomUser } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 30);
      await expect(escrow.connect(randomUser).openDispute(1, ethers.ZeroHash)).to.be.revertedWith("Not party to escrow");
      await escrow.connect(client).openDispute(1, ethers.ZeroHash);
      await expect(escrow.connect(randomUser).submitEvidence(1, ethers.ZeroHash)).to.be.revertedWith("Not party to escrow");
      await time.increase(31 * DAY);
      await expect(escrow.connect(randomUser).resolveStaleDispute(1)).to.be.revertedWith("Not party to escrow");
    });
    it("acceptEscrow only by provider; no double-accept", async () => {
      const { escrow, usdt, client, provider, randomUser } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 30);
      await expect(escrow.connect(randomUser).acceptEscrow(1)).to.be.revertedWith("Only provider");
      await escrow.connect(provider).acceptEscrow(1);
      await expect(escrow.connect(provider).acceptEscrow(1)).to.be.revertedWith("Already accepted");
    });
  });

  describe("11. Boundaries & validation", () => {
    it("resolveDispute invalid split", async () => {
      const { escrow, usdt, owner, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 30);
      await escrow.connect(client).openDispute(1, ethers.ZeroHash);
      await expect(escrow.connect(owner).resolveDispute(1, 10001)).to.be.revertedWith("Invalid split");
    });
    it("queue fee too high", async () => {
      const { escrow, owner } = await loadFixture(deployFixture);
      await expect(escrow.connect(owner).queueDefaultFee(2001)).to.be.revertedWith("Fee too high (max 20%)");
    });
    it("stale timeout out of range", async () => {
      const { escrow, owner } = await loadFixture(deployFixture);
      await expect(escrow.connect(owner).queueStaleTimeout(6)).to.be.revertedWith("Stale timeout out of range");
      await expect(escrow.connect(owner).queueStaleTimeout(91)).to.be.revertedWith("Stale timeout out of range");
    });
    it("timeout below min", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await expect(escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 2))
        .to.be.revertedWith("Invalid timeout");
    });
    it("token not whitelisted", async () => {
      const { escrow, std, client, provider } = await loadFixture(deployFixture);
      await expect(escrow.connect(client).createAndFundEscrow(provider.address, await std.getAddress(), E(1), 30))
        .to.be.revertedWith("Token not whitelisted");
    });
    it("withdraw nothing", async () => {
      const { escrow, usdt, client } = await loadFixture(deployFixture);
      await expect(escrow.connect(client).withdraw(await usdt.getAddress())).to.be.revertedWith("Nothing to withdraw");
    });
    it("provider cannot equal client", async () => {
      const { escrow, usdt, client } = await loadFixture(deployFixture);
      await expect(escrow.connect(client).createAndFundEscrow(client.address, await usdt.getAddress(), E(1), 30))
        .to.be.revertedWith("Invalid provider");
    });
  });

  describe("12. De-whitelisting (V3 fix)", () => {
    it("in-flight escrow stays settlable; symbol cleared", async () => {
      const { escrow, usdt, owner, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 30);
      await escrow.connect(owner).setTokenAllowed(u, "USDT", 0, 0, false);
      expect(await escrow.tokenSymbol(u)).to.equal("");
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).releaseFunds(1);
      await escrow.connect(provider).withdraw(u);
      expect(await usdt.balanceOf(provider.address)).to.equal(E(92));
    });
  });

  describe("13. Accounting invariant", () => {
    it("balance == locked + withdrawable across the lifecycle", async () => {
      const { escrow, eAddr, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      const inv = async () =>
        expect(await usdt.balanceOf(eAddr)).to.equal(
          (await escrow.totalLocked(u)) + (await escrow.totalWithdrawable(u))
        );
      await inv();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(500), 30);
      await inv();
      await escrow.connect(provider).acceptEscrow(1);
      await escrow.connect(client).releaseFunds(1);
      await inv();
      await escrow.connect(provider).withdraw(u);
      await inv();
    });
    it("activeEscrows counter returns to zero (cancel & release)", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 30);
      expect(await escrow.getActiveEscrowCount(client.address)).to.equal(1n);
      await escrow.connect(client).cancelEscrow(1);
      expect(await escrow.getActiveEscrowCount(client.address)).to.equal(0n);
      await escrow.connect(client).createAndFundEscrow(provider.address, u, E(100), 30);
      await escrow.connect(provider).acceptEscrow(2);
      await escrow.connect(client).releaseFunds(2);
      expect(await escrow.getActiveEscrowCount(client.address)).to.equal(0n);
    });
  });

  describe("14. Pagination", () => {
    it("paginates active escrows", async () => {
      const { escrow, usdt, client, provider } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      for (let i = 0; i < 5; i++) await escrow.connect(client).createAndFundEscrow(provider.address, u, E(10), 30);
      const p1 = await escrow.getActiveEscrowsByUser(client.address, 0, 2);
      expect(p1.map(Number)).to.deep.equal([1, 2]);
      const p2 = await escrow.getActiveEscrowsByUser(client.address, 2, 2);
      expect(p2.map(Number)).to.deep.equal([3, 4]);
      const p3 = await escrow.getActiveEscrowsByUser(client.address, 4, 5);
      expect(p3.map(Number)).to.deep.equal([5]);
    });
  });

  describe("15. Settlement sum (loop over edge values)", () => {
    it("provider + client + fee always equals amount (dispute split)", async () => {
      const { escrow, usdt, owner, client, provider, feeRecipient } = await loadFixture(deployFixture);
      const u = await usdt.getAddress();
      await usdt.connect(owner).transfer(client.address, E(200000)); // top up for the large-amount case
      const cases = [
        { amount: E(1),               bps: 0 },
        { amount: E(100000),          bps: 10000 },
        { amount: E(1) + 1n,          bps: 5000 },
        { amount: E("1234.56789"),    bps: 3333 },
        { amount: E("7777") + 7n,     bps: 9999 },
      ];
      let id = 0;
      for (const c of cases) {
        id++;
        await escrow.connect(client).createAndFundEscrow(provider.address, u, c.amount, 30);
        await escrow.connect(provider).acceptEscrow(id);
        await escrow.connect(client).openDispute(id, ethers.ZeroHash);
        const p0 = await wd(escrow, provider.address, u);
        const c0 = await wd(escrow, client.address, u);
        const f0 = await wd(escrow, feeRecipient.address, u);
        await escrow.connect(owner).resolveDispute(id, c.bps);
        const dp = (await wd(escrow, provider.address, u)) - p0;
        const dc = (await wd(escrow, client.address, u)) - c0;
        const df = (await wd(escrow, feeRecipient.address, u)) - f0;
        expect(dp + dc + df).to.equal(c.amount);
      }
    });
  });

});
