// Reference d'escrow gravee dans la transaction de creation, sans toucher au contrat V4 :
// le texte "JOOBREF:<reference>" est ajoute a la fin du calldata de createAndFundEscrow.
// Le contrat ne lit que ses 4 parametres et ignore ces octets (teste sur fork, 1 a 5 000 caracteres).
import { ethers } from 'ethers';
import { normalizeKolHandle, KOL_PATTERN, KOL_MAX_LENGTH } from './kolFlag.js';

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

// --- Flag KOL (JOOBKOL) : attribution d'un escrow au KOL qui a apporte le client ---
// Ajout pur : buildCreateData, referenceFromInput et cacheKey ne changent pas. Sans KOL, le calldata
// reste identique octet pour octet. Avec KOL, "JOOBKOL:<handle>" est ajoute apres la reference
// eventuelle, separe par un octet 0x00 : referenceFromInput s'arrete sur ce 0x00, la reference
// reste donc lisible (sans separateur, elle deviendrait "maRefJOOBKOL:..." et serait rejetee).

export const KOL_MAGIC = 'JOOBKOL:';

/**
 * Calldata de createAndFundEscrow avec reference et flag KOL facultatifs.
 * Sans handle valide : renvoie exactement buildCreateData(iface, args, reference).
 * Avec handle : base [+ "JOOBREF:<ref>" + 0x00] + "JOOBKOL:<handle>".
 */
export function buildCreateDataWithKol(iface, args, reference, kolHandle) {
  const data = buildCreateData(iface, args, reference);
  const kol = normalizeKolHandle(kolHandle);
  if (!kol) return data;
  const parts = [data];
  if (cleanReference(reference)) parts.push(new Uint8Array([0]));
  parts.push(ethers.toUtf8Bytes(KOL_MAGIC + kol));
  return ethers.concat(parts);
}

/**
 * Extrait le handle KOL du calldata d'une transaction de creation, ou null.
 * Meme logique que referenceFromInput : marqueur cherche n'importe ou (appel direct ou lot EIP-7702),
 * lecture jusqu'au premier octet nul. Le handle grave doit deja etre en minuscules.
 */
export function kolFromInput(input) {
  try {
    const bytes = ethers.getBytes(input);
    const magic = ethers.toUtf8Bytes(KOL_MAGIC);
    for (let i = 0; i + magic.length <= bytes.length; i++) {
      let match = true;
      for (let k = 0; k < magic.length; k++) {
        if (bytes[i + k] !== magic[k]) { match = false; break; }
      }
      if (!match) continue;
      let end = i + magic.length;
      // Un caractere de plus que le maximum : un handle trop long est rejete au lieu d'etre tronque.
      while (end < bytes.length && bytes[end] !== 0 && end - i - magic.length <= KOL_MAX_LENGTH) end++;
      const handle = ethers.toUtf8String(bytes.slice(i + magic.length, end));
      return KOL_PATTERN.test(handle) ? handle : null;
    }
    return null;
  } catch {
    return null;
  }
}
