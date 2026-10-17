// Reference d'escrow gravee dans la transaction de creation, sans toucher au contrat V4 :
// le texte "JOOBREF:<reference>" est ajoute a la fin du calldata de createAndFundEscrow.
// Le contrat ne lit que ses 4 parametres et ignore ces octets (teste sur fork, 1 a 5 000 caracteres).
import { ethers } from 'ethers';

export const REF_MAGIC = 'JOOBREF:';
export const REF_MAX_LENGTH = 64;

// Lettres, chiffres, tiret, underscore, point et espace : lisible, sans contenu gene grave pour toujours.
export const REF_PATTERN = /^[A-Za-z0-9 _.\-]*$/;

export const cleanReference = (ref) => (ref || '').trim().slice(0, REF_MAX_LENGTH);

/** Calldata de createAndFundEscrow, suivi de la reference si elle est renseignee. */
export function buildCreateData(iface, args, reference) {
  const base = iface.encodeFunctionData('createAndFundEscrow', args);
  const ref = cleanReference(reference);
  return ref ? ethers.concat([base, ethers.toUtf8Bytes(REF_MAGIC + ref)]) : base;
}

/**
 * Extrait la reference du calldata d'une transaction de creation, ou null.
 * Appel direct : la reference suit les 4 arguments. Wallet a compte intelligent (ex. MetaMask, EIP-7702) :
 * l'appel est imbrique dans un lot (approve + creation), avec du remplissage a zeros apres la reference.
 * On cherche donc le marqueur n'importe ou dans le calldata et on lit jusqu'au premier octet nul.
 */
export function referenceFromInput(input) {
  try {
    const bytes = ethers.getBytes(input);
    const magic = ethers.toUtf8Bytes(REF_MAGIC);
    for (let i = 0; i + magic.length <= bytes.length; i++) {
      let match = true;
      for (let k = 0; k < magic.length; k++) {
        if (bytes[i + k] !== magic[k]) { match = false; break; }
      }
      if (!match) continue;
      let end = i + magic.length;
      while (end < bytes.length && bytes[end] !== 0 && end - i - magic.length < REF_MAX_LENGTH) end++;
      const ref = cleanReference(ethers.toUtf8String(bytes.slice(i + magic.length, end)));
      return ref && REF_PATTERN.test(ref) ? ref : null;
    }
    return null;
  } catch {
    return null;
  }
}

const TOPIC_CREATED = ethers.id('EscrowCreated(uint256,address,address,address,uint256,uint256)');
// v2 : invalide les « pas de reference » mis en cache avant la prise en charge des comptes intelligents.
export const cacheKey = (contract, id) => `escrowRef2:${contract.toLowerCase()}:${id}`;

/**
 * Retrouve la reference d'un escrow a partir de sa date de creation (createdAt = horodatage du bloc) :
 * recherche du bloc par dichotomie, puis log EscrowCreated filtre sur l'identifiant (quelques blocs).
 */
export async function readEscrowReference(provider, contract, escrowId, createdAt) {
  const key = cacheKey(contract, escrowId);
  try {
    const cached = localStorage.getItem(key);
    if (cached !== null) return cached || null;
  } catch {}

  const target = Number(createdAt);
  let lo = 0;
  let hi = await provider.getBlockNumber();
  const head = hi;
  // Point de depart estime pour limiter les appels (bloc BSC < 1 s).
  const latest = await provider.getBlock(hi);
  lo = Math.max(0, hi - Math.ceil((latest.timestamp - target) / 0.4) - 50000);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const b = await provider.getBlock(mid);
    if (b.timestamp < target) lo = mid + 1; else hi = mid;
  }

  const logs = await provider.getLogs({
    address: contract,
    fromBlock: lo,
    toBlock: Math.min(lo + 9, head),
    topics: [TOPIC_CREATED, ethers.zeroPadValue(ethers.toBeHex(BigInt(escrowId)), 32)],
  });
  if (!logs.length) return null;
  const tx = await provider.getTransaction(logs[0].transactionHash);
  const ref = tx ? referenceFromInput(tx.data) : null;
  try { localStorage.setItem(key, ref ?? ''); } catch {}
  return ref;
}
