import { Proof } from './proof.js';
import { Groth16Verifier } from './verifier.js';
import fs from 'fs';

// args = [vk_path, proof_path, mlo_write_path]

const groth16 = new Groth16Verifier(process.argv[2]);
const proof = Proof.parse(groth16.vk, process.argv[3]);
const mlo = groth16.multiMillerLoop(proof);

fs.writeFileSync(process.argv[4], mlo.toJSON(), 'utf-8');
console.log(`JSON data has been written to ${process.argv[4]}`);
