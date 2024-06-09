import { ZKP1Proof, ZKP1Input, ZKP1Output, zkp1 } from './zkp1.js'
import { ZKP2Proof, ZKP2Input, ZKP2Output, zkp2 } from './zkp2.js'
import { ZKP3Proof, ZKP3Input, ZKP3Output, zkp3 } from './zkp3.js'
import {
    ZkProgram,
    Field,
    DynamicProof,
    Proof,
    VerificationKey,
    Undefined,
    verify,
    Provable,
    Struct,
    Poseidon,
    Cache,
  } from 'o1js';
import { getBHardcodedLines, getNegA, getB, getC, getPI, get_c_hint, get_alpha_beta, make_w27 } from './helpers.js';
import { GAMMA_1S, GAMMA_2S, NEG_GAMMA_13 } from '../towers/precomputed.js';
import { ATE_LOOP_COUNT, Fp12, Fp2, FpC } from '../towers/index.js';
import { GWitnessTracker } from './g_witness_tracker.js';
import fs from 'fs';
import { ZKP4Input, ZKP4Proof, zkp4 } from './zkp4.js';
import { G2Line } from '../lines/index.js';
import { ZKP5Input, ZKP5Proof, zkp5 } from './zkp5.js';
import { ZKP6Input, ZKP6Proof, zkp6 } from './zkp6.js';
import { ZKP7Input, ZKP7Proof, zkp7 } from './zkp7.js';
import { ZKP8Input, ZKP8Proof, zkp8 } from './zkp8.js';
import { ZKP9Input, ZKP9Proof, zkp9 } from './zkp9.js';
import { ZKP10Input, ZKP10Proof, zkp10 } from './zkp10.js';
import { ZKP11Input, ZKP11Proof, zkp11 } from './zkp11.js';
import { ZKP12Input, zkp12 } from './zkp12.js';
// import { ZKP4Input, ZKP4Proof, zkp4 } from './zkp4.js';
// import { G2Line } from '../lines/index.js';
// import { ZKP5Input, ZKP5Proof, zkp5 } from './zkp5.js';
// import { ZKP6Input, ZKP6Proof, zkp6 } from './zkp6.js';
// import { ZKP7Input, ZKP7Proof, zkp7 } from './zkp7.js';
// import { ZKP8Input, ZKP8Proof, zkp8 } from './zkp8.js';
// import { ZKP9Input, ZKP9Proof, zkp9 } from './zkp9.js';
// import { ZKP10Input, ZKP10Proof, zkp10 } from './zkp10.js';
// import { ZKP11Input, ZKP11Proof, zkp11 } from './zkp11.js';
// import { ZKP12Input, ZKP12Proof, zkp12 } from './zkp12.js';
// import { ZKP13Input, ZKP13Proof, zkp13 } from './zkp13.js';
// import { ZKP14Input, ZKP14Proof, zkp14 } from './zkp14.js';
// import { ZKP15Input, ZKP15Proof, zkp15 } from './zkp15.js';
// import { ZKP16Input, ZKP16Proof, zkp16 } from './zkp16.js';
// import { ZKP17Input, zkp17 } from './zkp17.js';

async function runZKP1() {
    const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

    const bLines = getBHardcodedLines();
    let zkp1Input = new ZKP1Input({
      negA: getNegA(), 
      b: getB()
    });

    const proof1 = await zkp1.compute(zkp1Input, bLines.slice(0, 62));
    const validZkp1 = await verify(proof1, VK1);
    console.log('ok?', validZkp1);
    fs.writeFileSync('./src/groth16/zkp1.json', JSON.stringify(proof1), 'utf8');
    fs.writeFileSync('./src/groth16/vk1.json', JSON.stringify(VK1), 'utf8');
}

async function runZKP2() {
    const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
    const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

    const proof1 = await ZKP1Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp1.json', 'utf8')));

    const bLines = getBHardcodedLines();
    const gt = new GWitnessTracker();
    const g = gt.zkp1(getNegA(), bLines, getB());

    const proof2 = await zkp2.compute(ZKP2Input, g, bLines.slice(62, 62 + 29), proof1, GAMMA_1S[1], GAMMA_1S[2], NEG_GAMMA_13);
    const validZkp2 = await verify(proof2, VK2);
    console.log('ok?', validZkp2);
    fs.writeFileSync('./src/groth16/zkp2.json', JSON.stringify(proof2), 'utf8');
    fs.writeFileSync('./src/groth16/vk2.json', JSON.stringify(VK2), 'utf8');
}

async function runZKP3() {
    const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
    const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
    const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

    const proof2 = await ZKP2Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp2.json', 'utf8')));

    const bLines = getBHardcodedLines();

    const gt = new GWitnessTracker();
    let g = gt.zkp1(getNegA(), bLines, getB());
    g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());

    const zkp3Input = new ZKP3Input({
      C: getC()
    });

    const proof3 = await  zkp3.compute(zkp3Input, g, proof2);
    const validZkp3 = await verify(proof3, VK3);
    console.log('ok?', validZkp3);
    fs.writeFileSync('./src/groth16/zkp3.json', JSON.stringify(proof3), 'utf8');
    fs.writeFileSync('./src/groth16/vk3.json', JSON.stringify(VK3), 'utf8');
}

async function runZKP4() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;


  const proof3 = await ZKP3Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp3.json', 'utf8')));

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));

  const zkp4Input = new ZKP4Input({
  });

  const proof4 = await zkp4.compute(zkp4Input, g, proof3);
  const validZkp4 = await verify(proof4, VK4);
  console.log('ok?', validZkp4);
  fs.writeFileSync('./src/groth16/zkp4.json', JSON.stringify(proof4), 'utf8');
  fs.writeFileSync('./src/groth16/vk4.json', JSON.stringify(VK4), 'utf8');
}

async function runZKP5() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK5 = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

  const proof4 = await ZKP4Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp4.json', 'utf8')));

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));
  g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));

  const zkp5Input = new ZKP5Input({
  });

  const proof5 = await zkp5.compute(zkp5Input, g, proof4);
  const validZkp5 = await verify(proof5, VK5);
  console.log('ok?', validZkp5);
  fs.writeFileSync('./src/groth16/zkp5.json', JSON.stringify(proof5), 'utf8');
  fs.writeFileSync('./src/groth16/vk5.json', JSON.stringify(VK5), 'utf8');
}

async function runZKP6() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK5 = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK6 = (await zkp6.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;


  const proof5 = await ZKP5Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp5.json', 'utf8')));
  // console.log(proof5.publicOutput.gDigest);

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));
  g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));
  g = gt.zkp5(g, getC(), delta_lines.slice(40, 59));

  const zkp6Input = new ZKP6Input({
  });

  const proof6 = await zkp6.compute(zkp6Input, g, proof5);
  const validZkp6 = await verify(proof6, VK6);
  console.log('ok?', validZkp6);
  fs.writeFileSync('./src/groth16/zkp6.json', JSON.stringify(proof6), 'utf8');
  fs.writeFileSync('./src/groth16/vk6.json', JSON.stringify(VK6), 'utf8');
}

async function runZKP7() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK5 = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK6 = (await zkp6.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK7 = (await zkp7.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

  const proof6 = await ZKP6Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp6.json', 'utf8')));
  // console.log(proof6.publicOutput.gDigest);

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));
  g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));
  g = gt.zkp5(g, getC(), delta_lines.slice(40, 59));
  g = gt.zkp6(g, getC(), delta_lines.slice(59, 78));

  const zkp7Input = new ZKP7Input({
  });

  const proof7 = await zkp7.compute(zkp7Input, g, proof6);
  const validZkp7 = await verify(proof7, VK7);
  console.log('ok?', validZkp7);
  fs.writeFileSync('./src/groth16/zkp7.json', JSON.stringify(proof7), 'utf8');
  fs.writeFileSync('./src/groth16/vk7.json', JSON.stringify(VK7), 'utf8');
}

async function runZKP8() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK5 = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK6 = (await zkp6.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK7 = (await zkp7.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK8 = (await zkp8.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

  const proof7 = await ZKP7Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp7.json', 'utf8')));
  // console.log(proof7.publicOutput.gDigest);

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));
  g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));
  g = gt.zkp5(g, getC(), delta_lines.slice(40, 59));
  g = gt.zkp6(g, getC(), delta_lines.slice(59, 78));
  g = gt.zkp7(g, getC(), delta_lines.slice(78, 91));

  const zkp8Input = new ZKP8Input({
    PI: getPI()
  });

  const proof8 = await zkp8.compute(zkp8Input, g, proof7);
  const validZkp8 = await verify(proof8, VK8);
  console.log('ok?', validZkp8);
  fs.writeFileSync('./src/groth16/zkp8.json', JSON.stringify(proof8), 'utf8');
  fs.writeFileSync('./src/groth16/vk8.json', JSON.stringify(VK8), 'utf8');
}

async function runZKP9() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK5 = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK6 = (await zkp6.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK7 = (await zkp7.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK8 = (await zkp8.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK9 = (await zkp9.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;


  const proof8 = await ZKP8Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp8.json', 'utf8')));
  // console.log(proof7.publicOutput.gDigest);

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
  let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
  const gamma_lines = parsed_gamma_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));
  g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));
  g = gt.zkp5(g, getC(), delta_lines.slice(40, 59));
  g = gt.zkp6(g, getC(), delta_lines.slice(59, 78));
  g = gt.zkp7(g, getC(), delta_lines.slice(78, 91));
  g = gt.zkp8(g, getPI(), gamma_lines.slice(0, 20));


  const zkp9Input = new ZKP9Input({
  });

  const proof9 = await zkp9.compute(zkp9Input, g, proof8);
  const validZkp9 = await verify(proof9, VK9);
  console.log('ok?', validZkp9);
  fs.writeFileSync('./src/groth16/zkp9.json', JSON.stringify(proof9), 'utf8');
  fs.writeFileSync('./src/groth16/vk9.json', JSON.stringify(VK9), 'utf8');
}

async function runZKP10() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK5 = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK6 = (await zkp6.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK7 = (await zkp7.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK8 = (await zkp8.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK9 = (await zkp9.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK10 = (await zkp10.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

  const proof9 = await ZKP9Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp9.json', 'utf8')));

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
  let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
  const gamma_lines = parsed_gamma_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));
  g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));
  g = gt.zkp5(g, getC(), delta_lines.slice(40, 59));
  g = gt.zkp6(g, getC(), delta_lines.slice(59, 78));
  g = gt.zkp7(g, getC(), delta_lines.slice(78, 91));
  g = gt.zkp8(g, getPI(), gamma_lines.slice(0, 20));
  g = gt.zkp9(g, getPI(), gamma_lines.slice(20, 40));

  const zkp10Input = new ZKP10Input({
  });

  const proof10 = await zkp10.compute(zkp10Input, g, proof9);
  const validZkp10 = await verify(proof10, VK10);
  console.log('ok?', validZkp10);
  fs.writeFileSync('./src/groth16/zkp10.json', JSON.stringify(proof10), 'utf8');
  fs.writeFileSync('./src/groth16/vk10.json', JSON.stringify(VK10), 'utf8');
}

async function runZKP11() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK5 = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK6 = (await zkp6.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK7 = (await zkp7.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK8 = (await zkp8.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK9 = (await zkp9.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK10 = (await zkp10.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK11 = (await zkp11.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

  const proof10 = await ZKP10Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp10.json', 'utf8')));

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
  let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
  const gamma_lines = parsed_gamma_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));
  g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));
  g = gt.zkp5(g, getC(), delta_lines.slice(40, 59));
  g = gt.zkp6(g, getC(), delta_lines.slice(59, 78));
  g = gt.zkp7(g, getC(), delta_lines.slice(78, 91));
  g = gt.zkp8(g, getPI(), gamma_lines.slice(0, 20));
  g = gt.zkp9(g, getPI(), gamma_lines.slice(20, 40));
  g = gt.zkp10(g, getPI(), gamma_lines.slice(40, 59));

  const zkp11Input = new ZKP11Input({
  });

  const proof11 = await zkp11.compute(zkp11Input, g, proof10);
  const validZkp11 = await verify(proof11, VK11);
  console.log('ok?', validZkp11);
  fs.writeFileSync('./src/groth16/zkp11.json', JSON.stringify(proof11), 'utf8');
  fs.writeFileSync('./src/groth16/vk11.json', JSON.stringify(VK11), 'utf8');
}

async function runZKP12() {
  const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK3 = (await zkp3.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK4 = (await zkp4.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK5 = (await zkp5.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK6 = (await zkp6.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK7 = (await zkp7.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK8 = (await zkp8.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK9 = (await zkp9.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK10 = (await zkp10.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK11 = (await zkp11.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
  const VK12 = (await zkp12.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;

  const proof11 = await ZKP11Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp11.json', 'utf8')));

  const bLines = getBHardcodedLines();
  let delta_lines_input = fs.readFileSync('./src/groth16/delta_lines.json', 'utf8');
  let parsed_delta_lines: any[] = JSON.parse(delta_lines_input);
  let delta_lines = parsed_delta_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  let gamma_lines_input = fs.readFileSync('./src/groth16/gamma_lines.json', 'utf8');
  let parsed_gamma_lines: any[] = JSON.parse(gamma_lines_input);
  const gamma_lines = parsed_gamma_lines.map(
    (g: any): G2Line => G2Line.fromJSON(g)
  );

  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB());
  g = gt.zkp3(g, getC(), delta_lines.slice(0, 20));
  g = gt.zkp4(g, getC(), delta_lines.slice(20, 40));
  g = gt.zkp5(g, getC(), delta_lines.slice(40, 59));
  g = gt.zkp6(g, getC(), delta_lines.slice(59, 78));
  g = gt.zkp7(g, getC(), delta_lines.slice(78, 91));
  g = gt.zkp8(g, getPI(), gamma_lines.slice(0, 20));
  g = gt.zkp9(g, getPI(), gamma_lines.slice(20, 40));
  g = gt.zkp10(g, getPI(), gamma_lines.slice(40, 59));
  g = gt.zkp11(g, getPI(), gamma_lines.slice(59, 78));

  const zkp12Input = new ZKP12Input({
  });

  const proof12 = await zkp12.compute(zkp12Input, g, proof11);

  console.log(proof12.publicOutput.gDigest);

  const validZkp12 = await verify(proof12, VK12);
  console.log('ok?', validZkp12);
  fs.writeFileSync('./src/groth16/zkp12.json', JSON.stringify(proof12), 'utf8');
  fs.writeFileSync('./src/groth16/vk12.json', JSON.stringify(VK12), 'utf8');
}

switch (process.argv[2]) {
    case 'zkp1':
        await runZKP1();
        break;  
    case 'zkp2':       
        await runZKP2();
        break;  
    case 'zkp3':       
        await runZKP3();
        break; 
    case 'zkp4':       
        await runZKP4();
        break; 
    case 'zkp5':       
        await runZKP5();
        break; 
    case 'zkp6':       
        await runZKP6();
        break; 
    case 'zkp7':       
        await runZKP7();
        break; 
    case 'zkp8': 
        await runZKP8(); 
        break;
    case 'zkp9': 
        await runZKP9(); 
        break;
    case 'zkp10': 
        await runZKP10(); 
        break;
    case 'zkp11': 
        await runZKP11(); 
        break;
    case 'zkp12': 
        await runZKP12(); 
        break;
}