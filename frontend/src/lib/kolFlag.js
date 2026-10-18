// Flag KOL : regles du clic sur un lien KOL (?ref=<handle>), sans dependance a ethers.
// Module separe d'escrowReference.js car il est charge par ReferralTracker dans le layout racine :
// importer ethers ici alourdirait toutes les pages, y compris les pages marketing.

// Nouvelle cle localStorage, distincte de 'joob_ref' (qui reste utilisee par l'evenement Analytics).
export const KOL_STORAGE_KEY = 'joob_kol';
// Handle : minuscules, chiffres, underscore, 2 a 32 caracteres (controle apres mise en minuscules).
export const KOL_PATTERN = /^[a-z0-9_]{2,32}$/;
export const KOL_MAX_LENGTH = 32;
// Duree de validite d'un clic sur un lien KOL : 30 jours, le dernier lien valide clique l'emporte.
export const KOL_CLICK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Handle normalise (minuscules, sans espaces autour) s'il respecte KOL_PATTERN, sinon null. */
export function normalizeKolHandle(handle) {
  if (typeof handle !== 'string') return null;
  const h = handle.trim().toLowerCase();
  return KOL_PATTERN.test(h) ? h : null;
}

/** Handle normalise s'il est valide ET actif dans le programme (config/kolProgram.json), sinon null. */
export function activeKolHandle(handle, program) {
  const h = normalizeKolHandle(handle);
  if (!h || !program || !Object.prototype.hasOwnProperty.call(program, h)) return null;
  return program[h]?.active === true ? h : null;
}

/** Valeur a stocker sous KOL_STORAGE_KEY lors d'un clic, ou null si le handle doit etre ignore. */
export function kolClickValue(handle, program, now = Date.now()) {
  const h = activeKolHandle(handle, program);
  return h ? JSON.stringify({ handle: h, ts: now }) : null;
}

/** Handle du clic stocke s'il est valide, toujours actif et non expire, sinon null (jamais d'erreur). */
export function kolFromStorage(raw, program, now = Date.now()) {
  try {
    if (!raw) return null;
    const { handle, ts } = JSON.parse(raw);
    if (typeof ts !== 'number' || !Number.isFinite(ts)) return null;
    // Horodatage dans le futur (horloge modifiee) ou clic de plus de 30 jours : ignore.
    if (ts > now + 60_000 || now - ts > KOL_CLICK_TTL_MS) return null;
    return activeKolHandle(handle, program);
  } catch {
    return null;
  }
}
