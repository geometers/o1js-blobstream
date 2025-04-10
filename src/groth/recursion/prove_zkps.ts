import { Poseidon, verify, Cache, Provable, Field } from 'o1js';
import { zkp0 } from './zkp0.js';
import fs from 'fs';
import { AuXWitness } from '../../aux_witness.js';
import { Proof } from '../proof.js';
import { Accumulator } from './data.js';
import { WitnessTracker } from '../witness_tracker.js';
import { zkp1 } from './zkp1.js';
import { zkp2 } from './zkp2.js';
import { zkp3 } from './zkp3.js';
import { zkp4 } from './zkp4.js';
import { zkp5 } from './zkp5.js';
import { zkp6 } from './zkp6.js';
import { zkp7 } from './zkp7.js';
import { zkp8 } from './zkp8.js';
import { zkp9 } from './zkp9.js';
import { zkp10 } from './zkp10.js';
import { zkp11 } from './zkp11.js';
import { zkp12 } from './zkp12.js';
import { zkp13 } from './zkp13.js';
import { zkp14 } from './zkp14.js';
import { zkp15 } from './zkp15.js';
import { G1Affine } from '../../ec/index.js';
import { FrC } from '../../towers/fr.js';
import { VK } from '../vk_from_env.js';

// npm run build && node build/src/groth/recursion/prove_zkps.js zkp0 ./src/groth/jsons/proof.json ./src/groth/jsons/aux_witness.json ../scripts/risc_zero_example/work_dir ../scripts/risc_zero_example/cache_dir

const args = process.argv;

const proof = Proof.parse(VK, args[3]);
const auxWitness = AuXWitness.parse(args[4]);
const workDir = args[5];
const cacheDir = args[6];

const wt = new WitnessTracker(proof, auxWitness);
const [acc_0, lines_0, all_b_lines] = wt.in0();
const [acc_1, lines_1] = wt.zkp0();
const [acc_2, lines_2] = wt.zkp1();
const [acc_3, lines_3] = wt.zkp2();
const [acc_4, lines_4] = wt.zkp3();
const [acc_5, lines_5] = wt.zkp4();
const [acc_6, lines_6] = wt.zkp5();
const [acc_7, final_line_hashes] = wt.zkp6();
const acc_8 = wt.zkp7();
const acc_9 = wt.zkp8();
const acc_10 = wt.zkp9();
const acc_11 = wt.zkp10();
const acc_12 = wt.zkp11();
const acc_13 = wt.zkp12();
const _ = wt.zkp13();
const partialPiAcc = wt.zkp14();
const g = wt.g;

async function prove_zkp0() {
  const vk0 = (await zkp0.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin0 = Poseidon.hashPacked(Accumulator, acc_0);
  const proof0 = await zkp0.compute(cin0, acc_0, lines_0, all_b_lines);

  const valid = await verify(proof0.proof, vk0);
  console.log('valid zkp0?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp0.json`,
    JSON.stringify(proof0.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk0.json`, JSON.stringify(vk0), 'utf8');
}

async function prove_zkp1() {
  const vk1 = (await zkp1.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin1 = Poseidon.hashPacked(Accumulator, acc_1);

  const proof1 = await zkp1.compute(cin1, acc_1, lines_1, all_b_lines);
  const valid = await verify(proof1.proof, vk1);
  console.log('valid zkp1?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp1.json`,
    JSON.stringify(proof1.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk1.json`, JSON.stringify(vk1), 'utf8');
}

async function prove_zkp2() {
  const vk2 = (await zkp2.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin2 = Poseidon.hashPacked(Accumulator, acc_2);

  const proof2 = await zkp2.compute(cin2, acc_2, lines_2, all_b_lines);
  const valid = await verify(proof2.proof, vk2);
  console.log('valid zkp2?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp2.json`,
    JSON.stringify(proof2.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk2.json`, JSON.stringify(vk2), 'utf8');
}

async function prove_zkp3() {
  const vk3 = (await zkp3.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin3 = Poseidon.hashPacked(Accumulator, acc_3);
  const proof3 = await zkp3.compute(cin3, acc_3, lines_3, all_b_lines);

  const valid = await verify(proof3.proof, vk3);
  console.log('valid zkp3?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp3.json`,
    JSON.stringify(proof3.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk3.json`, JSON.stringify(vk3), 'utf8');
}

async function prove_zkp4() {
  const vk4 = (await zkp4.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin4 = Poseidon.hashPacked(Accumulator, acc_4);
  const proof4 = await zkp4.compute(cin4, acc_4, lines_4, all_b_lines);

  const valid = await verify(proof4.proof, vk4);
  console.log('valid zkp4?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp4.json`,
    JSON.stringify(proof4.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk4.json`, JSON.stringify(vk4), 'utf8');
}

async function prove_zkp5() {
  const vk5 = (await zkp5.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin5 = Poseidon.hashPacked(Accumulator, acc_5);
  const proof5 = await zkp5.compute(cin5, acc_5, lines_5, all_b_lines);

  const valid = await verify(proof5.proof, vk5);
  console.log('valid zkp5?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp5.json`,
    JSON.stringify(proof5.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk5.json`, JSON.stringify(vk5), 'utf8');
}

async function prove_zkp6() {
  const vk6 = (await zkp6.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin6 = Poseidon.hashPacked(Accumulator, acc_6);
  const proof6 = await zkp6.compute(cin6, acc_6, lines_6, all_b_lines);

  const valid = await verify(proof6.proof, vk6);
  console.log('valid zkp6?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp6.json`,
    JSON.stringify(proof6.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk6.json`, JSON.stringify(vk6), 'utf8');
}

async function prove_zkp7() {
  const vk7 = (await zkp7.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin7 = Poseidon.hashPacked(Accumulator, acc_7);
  const proof7 = await zkp7.compute(
    cin7,
    acc_7,
    g.slice(0, 9),
    final_line_hashes.slice(9)
  );

  const valid = await verify(proof7.proof, vk7);
  console.log('valid zkp7?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp7.json`,
    JSON.stringify(proof7.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk7.json`, JSON.stringify(vk7), 'utf8');
}

async function prove_zkp8() {
  const vk8 = (await zkp8.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin8 = Poseidon.hashPacked(Accumulator, acc_8);
  const proof8 = await zkp8.compute(
    cin8,
    acc_8,
    final_line_hashes.slice(0, 9),
    g.slice(9, 9 + 11),
    final_line_hashes.slice(20)
  );

  const valid = await verify(proof8.proof, vk8);
  console.log('valid zkp8?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp8.json`,
    JSON.stringify(proof8.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk8.json`, JSON.stringify(vk8), 'utf8');
}

async function prove_zkp9() {
  const vk9 = (await zkp9.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin9 = Poseidon.hashPacked(Accumulator, acc_9);
  const proof9 = await zkp9.compute(
    cin9,
    acc_9,
    final_line_hashes.slice(0, 20),
    g.slice(20, 20 + 11),
    final_line_hashes.slice(31)
  );

  const valid = await verify(proof9.proof, vk9);
  console.log('valid zkp9?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp9.json`,
    JSON.stringify(proof9.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk9.json`, JSON.stringify(vk9), 'utf8');
}

async function prove_zkp10() {
  const vk10 = (await zkp10.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin10 = Poseidon.hashPacked(Accumulator, acc_10);
  const proof10 = await zkp10.compute(
    cin10,
    acc_10,
    final_line_hashes.slice(0, 31),
    g.slice(31, 31 + 11),
    final_line_hashes.slice(42)
  );

  const valid = await verify(proof10.proof, vk10);
  console.log('valid zkp10?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp10.json`,
    JSON.stringify(proof10.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk10.json`, JSON.stringify(vk10), 'utf8');
}

async function prove_zkp11() {
  const vk11 = (await zkp11.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin11 = Poseidon.hashPacked(Accumulator, acc_11);
  const proof11 = await zkp11.compute(
    cin11,
    acc_11,
    final_line_hashes.slice(0, 42),
    g.slice(42, 42 + 11),
    final_line_hashes.slice(53)
  );

  const valid = await verify(proof11.proof, vk11);
  console.log('valid zkp11?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp11.json`,
    JSON.stringify(proof11.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk11.json`, JSON.stringify(vk11), 'utf8');
}

async function prove_zkp12() {
  const vk12 = (await zkp12.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin12 = Poseidon.hashPacked(Accumulator, acc_12);
  const proof12 = await zkp12.compute(
    cin12,
    acc_12,
    final_line_hashes.slice(0, 53),
    g.slice(53, 53 + 11),
    final_line_hashes.slice(64)
  );

  const valid = await verify(proof12.proof, vk12);
  console.log('valid zkp12?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp12.json`,
    JSON.stringify(proof12.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk12.json`, JSON.stringify(vk12), 'utf8');
}

async function prove_zkp13() {
  const vk13 = (await zkp13.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  let cin13 = Poseidon.hashPacked(Accumulator, acc_13);
  const proof13 = await zkp13.compute(
    cin13,
    acc_13,
    final_line_hashes.slice(0, 64),
    g.slice(-1)
  );

  const valid = await verify(proof13.proof, vk13);
  console.log('valid zkp13?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp13.json`,
    JSON.stringify(proof13.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk13.json`, JSON.stringify(vk13), 'utf8');
}

async function prove_zkp14() {
  const vk14 = (await zkp14.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  const cin14 = Poseidon.hashPacked(G1Affine, proof.PI);
  const proof14 = await zkp14.compute(cin14, proof.pis);

  const valid = await verify(proof14.proof, vk14);
  console.log('valid zkp14?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp14.json`,
    JSON.stringify(proof14.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk14.json`, JSON.stringify(vk14), 'utf8');
}

async function prove_zkp15() {
  const vk15 = (await zkp15.compile({ cache: Cache.FileSystem(cacheDir) }))
    .verificationKey;

  const pi_hash = Poseidon.hashPacked(G1Affine, proof.PI);
  const pis_hash = Poseidon.hashPacked(
    Provable.Array(FrC.provable, 5),
    proof.pis
  );
  const acc_hash = Poseidon.hashPacked(G1Affine, partialPiAcc);

  const cin15 = Poseidon.hashPacked(Provable.Array(Field, 3), [
    pi_hash,
    pis_hash,
    acc_hash,
  ]);
  const proof15 = await zkp15.compute(cin15, proof.PI, partialPiAcc, proof.pis);

  const valid = await verify(proof15.proof, vk15);
  console.log('valid zkp15?: ', valid);

  fs.writeFileSync(
    `${workDir}/proofs/layer0/zkp15.json`,
    JSON.stringify(proof15.proof),
    'utf8'
  );
  fs.writeFileSync(`${workDir}/vks/vk15.json`, JSON.stringify(vk15), 'utf8');
}

if (!fs.existsSync(workDir)) {
  fs.mkdirSync(workDir);
}
switch (process.argv[2]) {
  case 'zkp0':
    await prove_zkp0();
    break;
  case 'zkp1':
    await prove_zkp1();
    break;
  case 'zkp2':
    await prove_zkp2();
    break;
  case 'zkp3':
    await prove_zkp3();
    break;
  case 'zkp4':
    await prove_zkp4();
    break;
  case 'zkp5':
    await prove_zkp5();
    break;
  case 'zkp6':
    await prove_zkp6();
    break;
  case 'zkp7':
    await prove_zkp7();
    break;
  case 'zkp8':
    await prove_zkp8();
    break;
  case 'zkp9':
    await prove_zkp9();
    break;
  case 'zkp10':
    await prove_zkp10();
    break;
  case 'zkp11':
    await prove_zkp11();
    break;
  case 'zkp12':
    await prove_zkp12();
    break;
  case 'zkp13':
    await prove_zkp13();
    break;
  case 'zkp14':
    await prove_zkp14();
    break;
  case 'zkp15':
    await prove_zkp15();
    break;
}
