import { Sp1PlonkVerifier } from './verifier.js';
import { VK } from './vk.js';
import fs from 'fs';
import { Sp1PlonkProof, deserializeProof } from './proof.js';
import { parsePublicInputs } from './parse_pi.js';
import { Fp12 } from '../towers/fp12.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const g2_lines_required = require('./mm_loop/g2_lines.json');
const tau_lines_required = require('./mm_loop/tau_lines.json');
//import g2_lines_required from './mm_loop/g2_lines.json';
//import tau_lines_required from './mm_loop/tau_lines.json';
const g2_lines = JSON.stringify(g2_lines_required); //fs.readFileSync(`./src/plonk/mm_loop/g2_lines.json`, 'utf8');
const tau_lines = JSON.stringify(tau_lines_required); //fs.readFileSync(`./src/plonk/mm_loop/tau_lines.json`, 'utf8');

export function getMlo(
  hexProof: string,
  programVk: string,
  hexPi: string
): Fp12 {
  console.log(hexProof, programVk, hexPi);
  const [pi0, pi1] = parsePublicInputs(programVk, hexPi);

  const Verifier = new Sp1PlonkVerifier(VK, g2_lines, tau_lines);

  const proof = new Sp1PlonkProof(deserializeProof(hexProof));
  return Verifier.computeMlo(proof, pi0, pi1);
}
