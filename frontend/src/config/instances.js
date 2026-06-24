import { ESCROW_ADDRESS } from './contract';

const SANDBOX_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;

const CONTRACT_10_PERCENT = SANDBOX_ADDRESS || "0xD5B180580D183A7A9278118312207bc8a9C9f89E";
const CONTRACT_8_PERCENT = SANDBOX_ADDRESS || "0xa45f887b938a08B295A5b96b6559600632F09Ab0";
const CONTRACT_5_PERCENT = SANDBOX_ADDRESS || "0x56c2227E06dBC16062179Be397839b101a8e58c7";
const CONTRACT_3_PERCENT = SANDBOX_ADDRESS || "0x3EEEA456daCF2247CB0023a70923E60C3E13D6C3";
const CONTRACT_2_PERCENT = SANDBOX_ADDRESS || "0x7986Bd37C4DA6d1822958fCB97E7a284b40DD7Cc";

export const instances = {
  influence: {
    name: "Influence",
    slug: "influence",
    lexicon: {
      client: "Brand",
      provider: "Influencer",
      action: "Campaign",
      escrow: "Influence Escrow"
    },
    theme: {
      primary: "#10b981", // Emerald
      bg: "bg-gray-900"
    },
    contractAddress: CONTRACT_10_PERCENT,
    feeTier: 10
  },
  talent: {
    name: "Talent",
    slug: "talent",
    lexicon: {
      client: "Company",
      provider: "Freelancer",
      action: "Mission",
      escrow: "Freelance Escrow"
    },
    theme: {
      primary: "#3b82f6", // Blue
      bg: "bg-slate-900"
    },
    contractAddress: CONTRACT_10_PERCENT,
    feeTier: 8
  },
  pro: {
    name: "Pro Services",
    slug: "pro",
    lexicon: {
      client: "Client",
      provider: "Expert",
      action: "Service",
      escrow: "Pro Escrow"
    },
    theme: {
      primary: "#8b5cf6", // Violet
      bg: "bg-indigo-950"
    },
    contractAddress: CONTRACT_5_PERCENT,
    feeTier: 5
  },
  trade: {
    name: "Trade",
    slug: "trade",
    lexicon: {
      client: "Buyer",
      provider: "Seller",
      action: "Transaction",
      escrow: "Trade Escrow"
    },
    theme: {
      primary: "#f59e0b", // Amber
      bg: "bg-stone-900"
    },
    contractAddress: CONTRACT_3_PERCENT,
    feeTier: 3
  },
  prime: {
    name: "Prime",
    slug: "prime",
    lexicon: {
      client: "Principal",
      provider: "Agent",
      action: "Agreement",
      escrow: "Prime Escrow"
    },
    theme: {
      primary: "#eab308", // Yellow Gold
      bg: "bg-zinc-950"
    },
    contractAddress: CONTRACT_2_PERCENT,
    feeTier: 2
  },
  audit: {
    name: "Audit & Security",
    slug: "audit",
    lexicon: { client: "Project", provider: "Auditor", action: "Audit", escrow: "Audit Escrow" },
    theme: { primary: "#14b8a6", bg: "bg-teal-950" },
    contractAddress: CONTRACT_5_PERCENT,
    feeTier: 5 // Uses the 5% contract
  },
  dev: {
    name: "Development",
    slug: "dev",
    lexicon: { client: "Founder", provider: "Developer", action: "Code Delivery", escrow: "Dev Escrow" },
    theme: { primary: "#0ea5e9", bg: "bg-sky-950" },
    contractAddress: CONTRACT_5_PERCENT,
    feeTier: 5 // Uses the 5% contract
  },
  art: {
    name: "Art & Commission",
    slug: "art",
    lexicon: { client: "Collector", provider: "Artist", action: "Commission", escrow: "Art Escrow" },
    theme: { primary: "#ec4899", bg: "bg-fuchsia-950" },
    contractAddress: CONTRACT_8_PERCENT,
    feeTier: 8 // Uses the 8% contract
  },
  gaming: {
    name: "Gaming Assets",
    slug: "gaming",
    lexicon: { client: "Buyer", provider: "Player", action: "Transfer", escrow: "Gaming Escrow" },
    theme: { primary: "#a855f7", bg: "bg-purple-950" },
    contractAddress: CONTRACT_3_PERCENT,
    feeTier: 3 // Uses the 3% contract
  },
  realestate: {
    name: "Real Estate (OTC)",
    slug: "realestate",
    lexicon: { client: "Buyer", provider: "Broker", action: "Closing", escrow: "Estate Escrow" },
    theme: { primary: "#fbbf24", bg: "bg-amber-950" },
    contractAddress: CONTRACT_2_PERCENT,
    feeTier: 2 // Uses the 2% contract
  },
  music: {
    name: "Music Rights",
    slug: "music",
    lexicon: { client: "Label", provider: "Producer", action: "Clearance", escrow: "Music Escrow" },
    theme: { primary: "#f43f5e", bg: "bg-rose-950" },
    contractAddress: CONTRACT_5_PERCENT,
    feeTier: 5 // Uses the 5% contract
  },
  cm: {
    name: "Community Mgmt",
    slug: "cm",
    lexicon: { client: "Project", provider: "Manager", action: "Animation", escrow: "CM Escrow" },
    theme: { primary: "#6366f1", bg: "bg-indigo-950" },
    contractAddress: CONTRACT_8_PERCENT,
    feeTier: 8 // Uses the 8% contract (Talent)
  },
  domain: {
    name: "Domain Names",
    slug: "domain",
    lexicon: { client: "Buyer", provider: "Owner", action: "Transfer", escrow: "Domain Escrow" },
    theme: { primary: "#10b981", bg: "bg-emerald-950" },
    contractAddress: CONTRACT_3_PERCENT,
    feeTier: 3 // Uses the 3% contract
  },
  mergers: {
    name: "M&A Deals",
    slug: "mergers",
    lexicon: { client: "Acquirer", provider: "Target", action: "Acquisition", escrow: "M&A Escrow" },
    theme: { primary: "#ef4444", bg: "bg-red-950" },
    contractAddress: CONTRACT_2_PERCENT,
    feeTier: 2 // Uses the 2% contract
  },
  bounty: {
    name: "Bug Bounties",
    slug: "bounty",
    lexicon: { client: "Protocol", provider: "Hacker", action: "Disclosure", escrow: "Bounty Escrow" },
    theme: { primary: "#f97316", bg: "bg-orange-950" },
    contractAddress: CONTRACT_8_PERCENT,
    feeTier: 8 // Uses the 8% contract
  }
};

export const defaultInstance = "influence";
