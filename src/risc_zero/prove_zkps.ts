import {
  Provable,
  Poseidon,
  UInt64,
  verify,
  MerkleTree,
  Mina,
  AccountUpdate,
  Cache,
} from 'o1js';
import {
  riscZeroExampleVerifier,
  RiscZeroExampleProof,
} from './verify_risc_zero.js';
import { NodeProofLeft } from '../structs.js';
import fs from 'fs';
import { ethers } from 'ethers';
import { Proof } from '../groth/proof.js';
import { FrC } from '../towers/fr.js';
import { VK } from '../groth/vk_from_env.js';

const args = process.argv;

async function prove_risc_zero_example() {
  const riscZeroExampleTreeProofPath = args[3];
  const riscZeroExampleGroth16ProofPath = args[4];
  const riscZeroExampleOutputProofPath = args[5];
  const cacheDir = args[6];

  const riscZeroGroth16Proof = Proof.parse(VK, riscZeroExampleGroth16ProofPath);

  const riscZeroPlonkProof = await NodeProofLeft.fromJSON(
    JSON.parse(fs.readFileSync(riscZeroExampleTreeProofPath, 'utf8'))
  );

  const vk = (
    await riscZeroExampleVerifier.compile({ cache: Cache.FileSystem(cacheDir) })
  ).verificationKey;

  const proof = await riscZeroExampleVerifier.compute(
    Poseidon.hashPacked(
      Provable.Array(FrC.provable, 5),
      riscZeroGroth16Proof.pis
    ),
    riscZeroPlonkProof,
    riscZeroGroth16Proof.pis
  );

  const valid = await verify(proof.proof, vk);

  fs.writeFileSync(
    riscZeroExampleOutputProofPath,
    JSON.stringify(proof.proof),
    'utf8'
  );
  console.log('valid risc zero proof?: ', valid);
}

switch (args[2]) {
  case 'risc_zero':
    await prove_risc_zero_example();
    break;
}
