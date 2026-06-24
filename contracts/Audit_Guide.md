# Universal Service Escrow (V4) - Audit Guide

Welcome to the `UniversalServiceEscrow` Smart Contract. This document provides a high-level overview of the architecture, security mechanisms, and design choices to assist with your audit.

## Overview
The `UniversalServiceEscrow` is a generic Escrow engine designed for the BNB Smart Chain (BSC) to secure B2B/B2C services (primarily KOL marketing). It guarantees that a Sponsor's funds are safely locked until the agreed-upon service is provided by a KOL (Provider).

## Core State Machine
1. **FUNDED**: The Sponsor creates the escrow and deposits the funds.
2. **ACCEPTED** (Internal state via `accepted` boolean): The KOL explicitly accepts the job. Before acceptance, the Sponsor can cancel freely. After acceptance, cancellation requires a dispute.
3. **RELEASED**: The Sponsor is satisfied and releases the funds. A platform fee (BPS) is deducted, and the rest goes to the KOL.
4. **DISPUTED**: A conflict arises. The platform owner steps in to resolve it.
5. **RESOLVED**: The platform admin resolves the dispute by allocating a percentage (BPS) to the KOL and the rest back to the Sponsor.
6. **CANCELLED**: The Sponsor cancels the escrow before the KOL accepts the job. 100% of the funds are returned.

## Key Security Hardening (V4 vs V2/V3)

### 1. Pull-over-Push Pattern
To prevent griefing attacks (e.g., reverting fallbacks or blacklisted addresses), funds are **never pushed directly** to users. 
- All state changes (like `releaseFunds` or `resolveDispute`) simply credit an internal `withdrawable[user][token]` mapping.
- Users must explicitly call `withdraw(token)` or `batchWithdraw(tokens)` to pull their funds.

### 2. Strict Accounting Invariant
The contract maintains `totalLocked` (funds currently inside active escrows) and `totalWithdrawable` (funds credited to users but not yet withdrawn).
- The `recoverStuckTokens` function allows the admin to sweep mistakenly sent tokens, but it **strictly enforces** `balanceOf(address(this)) > (totalLocked + totalWithdrawable)`.
- **Drain Impossible**: Even a compromised or malicious owner cannot siphon funds belonging to active escrows or pending withdrawals.

### 3. Non-Binary Dispute Resolution
Disputes are not "all-or-nothing". The `resolveDispute` function takes a `_providerBps` argument (0 to 10000).
- Example: 5000 means a 50/50 split between the Sponsor and the KOL. 
- Platform fees are **only** applied to the portion awarded to the KOL.

### 4. Evidence Anchoring
When a dispute is opened, the caller provides an `evidenceHash` (typically an IPFS CID). Both parties can subsequently call `submitEvidence` to anchor their proofs on-chain, ensuring immutable timestamps for the dispute timeline.

### 5. Stale Dispute Resolution
If a dispute is abandoned by the platform admin and remains unresolved for `staleDisputeTimeout` (e.g., 30 days), either party can call `resolveStaleDispute`. 
- This acts as a dead-man's switch, automatically resolving the dispute by splitting the funds 50/50 between the Sponsor and the Provider. This prevents permanent locking and ensures no party can benefit from stalling.

### 6. Emergency Pause Circuit Breaker
The contract uses `Pausable` to stop creations, releases, and cancellations in case of an emergency.
- **Exception 1**: `withdraw` is intentionally NOT paused. Users must always be able to pull their credited funds (non-custodial principle).
- **Exception 2**: `resolveDispute` and `resolveStaleDispute` are intentionally NOT paused to allow unlocking of funds even during a global platform freeze.

### 7. Timelocked Admin Operations
Critical variables (Fees, Fee Recipient, Global Limits) are subject to a **48-hour Timelock**. 
- The admin must `queue` the change and wait for `TIMELOCK_DELAY` before executing it, ensuring transparency and preventing rug-pull parameter changes.

### 8. Fee-On-Transfer Token Support
When receiving funds in `createAndFundEscrow`, the contract uses the `balanceBefore` and `balanceAfter` paradigm to strictly record the actual amount received, fully supporting deflationary/fee-on-transfer tokens.

---
Thank you for your rigorous review. We remain available for any questions regarding the logic or architecture.
