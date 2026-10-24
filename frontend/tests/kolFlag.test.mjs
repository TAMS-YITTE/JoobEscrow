// Tests de non-regression du flag KOL (JOOBKOL). Lancement : node --test tests/kolFlag.test.mjs
// Les vecteurs GOLDEN ont ete generes avec escrowReference.js tel qu'il etait AVANT le flag KOL
// (commit b0ae5ac) : ils prouvent que le calldata sans KOL est identique octet pour octet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ethers } from 'ethers';
import {
  buildCreateData, referenceFromInput, buildCreateDataWithKol, kolFromInput, KOL_MAGIC,
} from '../src/lib/escrowReference.js';
import {
  normalizeKolHandle, activeKolHandle, kolClickValue, kolFromStorage, KOL_CLICK_TTL_MS, KOL_STORAGE_KEY,
} from '../src/lib/kolFlag.js';

const iface = new ethers.Interface([
  'function createAndFundEscrow(address _provider, address _token, uint256 _amount, uint256 _timeoutDays) returns (uint256)',
]);
const ARGS = ['0x1111111111111111111111111111111111111111', '0x55d398326f99059fF775485246999027B3197955', 123456789000000000000n, 7];

const BASE = '0x03e39edb000000000000000000000000111111111111111111111111111111111111111100000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000000000000000000000000006b14e9f7e4f5a50000000000000000000000000000000000000000000000000000000000000000007';
const GOLDEN = {
  '': BASE,
  'Invoice 42': BASE + '4a4f4f425245463a496e766f696365203432',
  '  spaced ref  ': BASE + '4a4f4f425245463a73706163656420726566',
  ['x'.repeat(80)]: BASE + '4a4f4f425245463a' + '78'.repeat(64),
};
const hex = (s) => ethers.hexlify(ethers.toUtf8Bytes(s)).slice(2);

const PROGRAM = { kyle: { active: true }, old_kol: { active: false } };
const NOW = Date.UTC(2026, 9, 19, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

// Lot MetaMask EIP-7702 : l'appel de creation est imbrique (approve + creation), avec remplissage a zeros.
const batchIface = new ethers.Interface(['function execute((address to,uint256 value,bytes data)[] calls)']);
const erc20 = new ethers.Interface(['function approve(address spender,uint256 amount)']);
const wrapInBatch = (data) => batchIface.encodeFunctionData('execute', [[
  [ARGS[1], 0n, erc20.encodeFunctionData('approve', ['0x2222222222222222222222222222222222222222', ARGS[2]])],
  ['0x2222222222222222222222222222222222222222', 0n, data],
]]);

test('sans KOL : calldata identique octet pour octet a la version d\'origine', () => {
  for (const [ref, golden] of Object.entries(GOLDEN)) {
    assert.equal(buildCreateData(iface, ARGS, ref), golden, `buildCreateData(${JSON.stringify(ref)})`);
    for (const noKol of [undefined, null, '', '   ', 'a', 'Bad-Handle!', 'x'.repeat(33), 42]) {
      assert.equal(buildCreateDataWithKol(iface, ARGS, ref, noKol), golden, `ref=${JSON.stringify(ref)} kol=${JSON.stringify(noKol)}`);
    }
  }
});

test('reference seule : lisible, aucun KOL', () => {
  const data = buildCreateDataWithKol(iface, ARGS, 'Invoice 42', null);
  assert.equal(referenceFromInput(data), 'Invoice 42');
  assert.equal(kolFromInput(data), null);
});

test('KOL seul : base + "JOOBKOL:<handle>", aucune reference', () => {
  const data = buildCreateDataWithKol(iface, ARGS, '', 'kyle');
  assert.equal(data, BASE + hex(KOL_MAGIC + 'kyle'));
  assert.equal(kolFromInput(data), 'kyle');
  assert.equal(referenceFromInput(data), null);
});

test('reference + KOL : separateur 0x00, les deux restent lisibles', () => {
  const data = buildCreateDataWithKol(iface, ARGS, 'Invoice 42', 'Kyle');
  assert.equal(data, GOLDEN['Invoice 42'] + '00' + hex(KOL_MAGIC + 'kyle'));
  assert.equal(referenceFromInput(data), 'Invoice 42');
  assert.equal(kolFromInput(data), 'kyle');
  // Reference de 64 caracteres (tronquee) suivie du KOL.
  const long = buildCreateDataWithKol(iface, ARGS, 'x'.repeat(80), 'kyle');
  assert.equal(referenceFromInput(long), 'x'.repeat(64));
  assert.equal(kolFromInput(long), 'kyle');
});

test('ordre inverse (JOOBKOL puis 0x00 puis JOOBREF) : les deux restent lisibles', () => {
  const data = ethers.concat([BASE, ethers.toUtf8Bytes('JOOBKOL:kyle'), new Uint8Array([0]), ethers.toUtf8Bytes('JOOBREF:Invoice 42')]);
  assert.equal(referenceFromInput(data), 'Invoice 42');
  assert.equal(kolFromInput(data), 'kyle');
});

test('piege n. 1 documente : sans separateur, la reference serait perdue', () => {
  const data = ethers.concat([BASE, ethers.toUtf8Bytes('JOOBREF:Invoice 42JOOBKOL:kyle')]);
  assert.equal(referenceFromInput(data), null);
});

test('le contrat lit toujours les 4 memes arguments (octets ajoutes ignores au decodage)', () => {
  for (const data of [
    buildCreateDataWithKol(iface, ARGS, '', 'kyle'),
    buildCreateDataWithKol(iface, ARGS, 'Invoice 42', 'kyle'),
  ]) {
    const decoded = iface.decodeFunctionData('createAndFundEscrow', data);
    assert.equal(decoded[0], ARGS[0]);
    assert.equal(decoded[1], ARGS[1]);
    assert.equal(decoded[2], ARGS[2]);
    assert.equal(decoded[3], 7n);
  }
});

test('lot EIP-7702 avec remplissage a zeros : reference et KOL extraits', () => {
  const both = wrapInBatch(buildCreateDataWithKol(iface, ARGS, 'Invoice 42', 'kyle'));
  assert.equal(referenceFromInput(both), 'Invoice 42');
  assert.equal(kolFromInput(both), 'kyle');

  const kolOnly = wrapInBatch(buildCreateDataWithKol(iface, ARGS, '', 'kyle'));
  assert.equal(referenceFromInput(kolOnly), null);
  assert.equal(kolFromInput(kolOnly), 'kyle');

  const refOnly = wrapInBatch(buildCreateDataWithKol(iface, ARGS, 'Invoice 42', null));
  assert.equal(refOnly, wrapInBatch(GOLDEN['Invoice 42']));
  assert.equal(referenceFromInput(refOnly), 'Invoice 42');
  assert.equal(kolFromInput(refOnly), null);
});

test('handle invalide grave a la main : ignore a la lecture', () => {
  const read = (s) => kolFromInput(ethers.concat([BASE, ethers.toUtf8Bytes(s)]));
  assert.equal(read('JOOBKOL:ab-c'), null);
  assert.equal(read('JOOBKOL:Kyle'), null); // majuscules : jamais ecrites par le site
  assert.equal(read('JOOBKOL:k'), null);
  assert.equal(read('JOOBKOL:' + 'a'.repeat(33)), null); // trop long : rejete, pas tronque
  assert.equal(read('JOOBKOL:' + 'a'.repeat(32)), 'a'.repeat(32));
  assert.equal(read('JOOBKOL:'), null);
  assert.equal(kolFromInput('not hex'), null);
  assert.equal(kolFromInput(BASE), null);
});

test('regles du handle et du programme', () => {
  assert.equal(normalizeKolHandle('  Kyle_01 '), 'kyle_01');
  for (const bad of ['k', 'a'.repeat(33), 'ky le', 'kyle!', 'kylé', '', null, undefined, 5]) {
    assert.equal(normalizeKolHandle(bad), null, JSON.stringify(bad));
  }
  assert.equal(activeKolHandle('KYLE', PROGRAM), 'kyle');
  assert.equal(activeKolHandle('old_kol', PROGRAM), null); // inactif
  assert.equal(activeKolHandle('unknown', PROGRAM), null); // inconnu
  assert.equal(activeKolHandle('constructor', PROGRAM), null); // cle heritee d'Object
  assert.equal(activeKolHandle('__proto__', PROGRAM), null);
  assert.equal(activeKolHandle('kyle', null), null);
});

test('clic : seul un handle valide et actif est stocke', () => {
  assert.equal(KOL_STORAGE_KEY, 'joob_kol');
  assert.deepEqual(JSON.parse(kolClickValue('Kyle', PROGRAM, NOW)), { handle: 'kyle', ts: NOW });
  assert.equal(kolClickValue('old_kol', PROGRAM, NOW), null);
  assert.equal(kolClickValue('unknown', PROGRAM, NOW), null);
  assert.equal(kolClickValue('<script>', PROGRAM, NOW), null);
});

test('KOL expire, futur, desactive ou illisible : ignore', () => {
  const click = (ts, handle = 'kyle') => JSON.stringify({ handle, ts });
  assert.equal(kolFromStorage(click(NOW), PROGRAM, NOW), 'kyle');
  assert.equal(kolFromStorage(click(NOW - 29 * DAY), PROGRAM, NOW), 'kyle');
  assert.equal(kolFromStorage(click(NOW - KOL_CLICK_TTL_MS), PROGRAM, NOW), 'kyle');
  assert.equal(kolFromStorage(click(NOW - KOL_CLICK_TTL_MS - 1), PROGRAM, NOW), null);
  assert.equal(kolFromStorage(click(NOW - 31 * DAY), PROGRAM, NOW), null);
  assert.equal(kolFromStorage(click(NOW + 2 * DAY), PROGRAM, NOW), null);
  assert.equal(kolFromStorage(click(NOW, 'old_kol'), PROGRAM, NOW), null);
  assert.equal(kolFromStorage(click(NOW, 'unknown'), PROGRAM, NOW), null);
  for (const raw of [null, '', 'kyle', '{', '{"handle":"kyle"}', '{"handle":"kyle","ts":"1"}', 'null', '[]']) {
    assert.equal(kolFromStorage(raw, PROGRAM, NOW), null, String(raw));
  }
});

test('config livree : kolProgram.json vide, donc aucun escrow flagge tant qu\'aucun KOL n\'est ajoute', () => {
  const program = JSON.parse(fs.readFileSync(new URL('../src/config/kolProgram.json', import.meta.url), 'utf8'));
  assert.deepEqual(program, {});
  assert.equal(kolFromStorage(JSON.stringify({ handle: 'kyle', ts: NOW }), program, NOW), null);
});

// --- Presale : parrain dedie du KOL (champ referrer de kolProgram.json) ---
import { kolPresaleReferrer } from '../src/lib/kolFlag.js';

test('presale : parrain KOL pour un clic valide, actif, avec adresse dediee', () => {
  const program = { kyle: { active: true, referrer: '0x1111111111111111111111111111111111111111' }, bob: { active: true } };
  const now = 1_800_000_000_000;
  const click = (h, ts = now) => JSON.stringify({ handle: h, ts });
  assert.deepEqual(kolPresaleReferrer(click('kyle'), program, now), { handle: 'kyle', referrer: '0x1111111111111111111111111111111111111111', ts: now });
  assert.equal(kolPresaleReferrer(click('bob'), program, now), null, 'KOL sans adresse dediee');
  assert.equal(kolPresaleReferrer(click('kyle', now - KOL_CLICK_TTL_MS - 1), program, now), null, 'clic expire');
  assert.equal(kolPresaleReferrer(click('kyle'), { kyle: { active: false, referrer: '0x1111111111111111111111111111111111111111' } }, now), null, 'KOL inactif');
  assert.equal(kolPresaleReferrer(click('kyle'), { kyle: { active: true, referrer: '0x123' } }, now), null, 'adresse invalide');
  assert.equal(kolPresaleReferrer(null, program, now), null);
});
