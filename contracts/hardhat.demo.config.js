// Config dediee au deploiement de l'instance DEMO de la V4.
// Force la compilation de la V4 avec les reglages exacts des 5 instances deja
// deployees (solc 0.8.20, optimizer 200 runs) : meme bytecode que la version auditee.
// Artefacts separes pour ne pas toucher a ceux du projet.
import base from "./hardhat.config.js";

const V4_SETTINGS = { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } };

export default {
  ...base,
  solidity: {
    ...base.solidity,
    overrides: { "src/UniversalServiceEscrow.sol": V4_SETTINGS },
  },
  paths: { ...base.paths, cache: "./cache-demo", artifacts: "./artifacts-demo" },
  // FORK=1 : repetition sur un fork du mainnet BSC (aucune transaction reelle).
  // SIM=1 : reseau local en chainId 56 sans fork (jetons factices installes par le script).
  networks: process.env.FORK
    ? { ...base.networks, hardhat: { chainId: 56, forking: { url: process.env.BSC_FORK_RPC || "https://bsc-dataseed.bnbchain.org" } } }
    : process.env.SIM
      ? { ...base.networks, hardhat: { chainId: 56 } }
      : base.networks,
};
