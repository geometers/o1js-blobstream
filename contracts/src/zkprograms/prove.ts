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
import { GAMMA_1S, GAMMA_2S, GAMMA_3S, NEG_GAMMA_13 } from '../towers/precomputed.js';
import { ATE_LOOP_COUNT, Fp12, Fp2, FpC } from '../towers/index.js';
import { witnessTracker } from './g_witness_tracker.js';
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
import { ZKP12Input, ZKP12Proof, zkp12 } from './zkp12.js';
import { ZKP13Input, ZKP13Proof, zkp13 } from './zkp13.js';
import { ZKP14Input, ZKP14Proof, zkp14 } from './zkp14.js';
import { ZKP15Input, ZKP15Proof, zkp15 } from './zkp15.js';
import { ZKP16Input, ZKP16Proof, zkp16 } from './zkp16.js';
import { ZKP17Input, ZKP17Proof, zkp17 } from './zkp17.js';
import { ZKP18Input, ZKP18Proof, zkp18 } from './zkp18.js';
import { ZKP19Input, ZKP19Proof, zkp19 } from './zkp19.js';
import { ZKP20Input, ZKP20Proof, zkp20 } from './zkp20.js';
import { ZKP21Input, ZKP21Proof, zkp21 } from './zkp21.js';
import { ZKP22Input, ZKP22Proof, zkp22 } from './zkp22.js';
import { ZKP23Input, ZKP23Proof, zkp23 } from './zkp23.js';
import { ZKP24Input, zkp24 } from './zkp24.js';
import { compileZKP, getBLines, getDeltaLines } from './compile.js'

async function runZKP1() {
    const VK1 = await compileZKP(1);

    const bLines = getBLines(1);
    let zkp1Input = new ZKP1Input({
      negA: getNegA(), 
      b: getB()
    });

    const proof1 = await zkp1.compute(zkp1Input, bLines);
    const validZkp1 = await verify(proof1, VK1!);
    console.log('ok?', validZkp1);
    fs.writeFileSync('./src/groth16/zkp1.json', JSON.stringify(proof1), 'utf8');
    fs.writeFileSync('./src/groth16/vk1.json', JSON.stringify(VK1), 'utf8');
}

async function runZKP2() {
    const VK2 = await compileZKP(2);
    const gt = witnessTracker(1);

    const proof1 = await ZKP1Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp1.json', 'utf8')));

    const proof2 = await zkp2.compute(ZKP2Input, gt!, getBLines(2), proof1, GAMMA_1S[1], GAMMA_1S[2], NEG_GAMMA_13);
    const validZkp2 = await verify(proof2, VK2!);
    console.log('ok?', validZkp2);
    fs.writeFileSync('./src/groth16/zkp2.json', JSON.stringify(proof2), 'utf8');
    fs.writeFileSync('./src/groth16/vk2.json', JSON.stringify(VK2), 'utf8');
}

async function runZKP3() {
    const VK3 = await compileZKP(3);
    const gt = witnessTracker(2);

    const proof2 = await ZKP2Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp2.json', 'utf8')));

    const zkp3Input = new ZKP3Input({
      C: getC()
    });

    const proof3 = await  zkp3.compute(zkp3Input, gt!, proof2);
    const validZkp3 = await verify(proof3, VK3!);
    console.log('ok?', validZkp3);
    fs.writeFileSync('./src/groth16/zkp3.json', JSON.stringify(proof3), 'utf8');
    fs.writeFileSync('./src/groth16/vk3.json', JSON.stringify(VK3), 'utf8');
}

async function runZKP4() {
  const VK4 = await compileZKP(4);
  const gt = witnessTracker(3);

  const proof3 = await ZKP3Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp3.json', 'utf8')));

  const zkp4Input = new ZKP4Input({
  });

  const proof4 = await zkp4.compute(zkp4Input, gt!, proof3);
  const validZkp4 = await verify(proof4, VK4!);
  console.log('ok?', validZkp4);
  fs.writeFileSync('./src/groth16/zkp4.json', JSON.stringify(proof4), 'utf8');
  fs.writeFileSync('./src/groth16/vk4.json', JSON.stringify(VK4), 'utf8');
}

async function runZKP5() {
  const VK5 = await compileZKP(5);
  const gt = witnessTracker(4);

  const proof4 = await ZKP4Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp4.json', 'utf8')));

  const zkp5Input = new ZKP5Input({
  });

  const proof5 = await zkp5.compute(zkp5Input, gt!, proof4);
  const validZkp5 = await verify(proof5, VK5!);
  console.log('ok?', validZkp5);
  fs.writeFileSync('./src/groth16/zkp5.json', JSON.stringify(proof5), 'utf8');
  fs.writeFileSync('./src/groth16/vk5.json', JSON.stringify(VK5), 'utf8');
}

async function runZKP6() {
  const VK6 = await compileZKP(6);
  const gt = witnessTracker(5);

  const proof5 = await ZKP5Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp5.json', 'utf8')));

  const zkp6Input = new ZKP6Input({
  });

  const proof6 = await zkp6.compute(zkp6Input, gt!, proof5);
  const validZkp6 = await verify(proof6, VK6!);
  console.log('ok?', validZkp6);
  fs.writeFileSync('./src/groth16/zkp6.json', JSON.stringify(proof6), 'utf8');
  fs.writeFileSync('./src/groth16/vk6.json', JSON.stringify(VK6), 'utf8');
}

async function runZKP7() {
  const VK7 = await compileZKP(7);
  const gt = witnessTracker(6);

  const proof6 = await ZKP6Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp6.json', 'utf8')));

  const zkp7Input = new ZKP7Input({
  });

  const proof7 = await zkp7.compute(zkp7Input, gt!, proof6);
  const validZkp7 = await verify(proof7, VK7!);
  console.log('ok?', validZkp7);
  fs.writeFileSync('./src/groth16/zkp7.json', JSON.stringify(proof7), 'utf8');
  fs.writeFileSync('./src/groth16/vk7.json', JSON.stringify(VK7), 'utf8');
}

async function runZKP8() {
  const VK8 = await compileZKP(8);
  const gt = witnessTracker(7);

  const proof7 = await ZKP7Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp7.json', 'utf8')));

  const zkp8Input = new ZKP8Input({
    PI: getPI()
  });

  const proof8 = await zkp8.compute(zkp8Input, gt!, proof7);
  const validZkp8 = await verify(proof8, VK8!);
  console.log('ok?', validZkp8);
  fs.writeFileSync('./src/groth16/zkp8.json', JSON.stringify(proof8), 'utf8');
  fs.writeFileSync('./src/groth16/vk8.json', JSON.stringify(VK8), 'utf8');
}

async function runZKP9() {
  const VK9 = await compileZKP(9);
  const gt = witnessTracker(8);

  const proof8 = await ZKP8Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp8.json', 'utf8')));

  const zkp9Input = new ZKP9Input({
  });

  const proof9 = await zkp9.compute(zkp9Input, gt!, proof8);
  const validZkp9 = await verify(proof9, VK9!);
  console.log('ok?', validZkp9);
  fs.writeFileSync('./src/groth16/zkp9.json', JSON.stringify(proof9), 'utf8');
  fs.writeFileSync('./src/groth16/vk9.json', JSON.stringify(VK9), 'utf8');
}

async function runZKP10() {
  const VK10 = await compileZKP(10);
  const gt = witnessTracker(9);

  const proof9 = await ZKP9Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp9.json', 'utf8')));

  const zkp10Input = new ZKP10Input({
  });

  const proof10 = await zkp10.compute(zkp10Input, gt!, proof9);
  const validZkp10 = await verify(proof10, VK10!);
  console.log('ok?', validZkp10);
  fs.writeFileSync('./src/groth16/zkp10.json', JSON.stringify(proof10), 'utf8');
  fs.writeFileSync('./src/groth16/vk10.json', JSON.stringify(VK10), 'utf8');
}

async function runZKP11() {
  const VK11 = await compileZKP(11);
  const gt = witnessTracker(10);

  const proof10 = await ZKP10Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp10.json', 'utf8')));

  const zkp11Input = new ZKP11Input({
  });

  const proof11 = await zkp11.compute(zkp11Input, gt!, proof10);
  const validZkp11 = await verify(proof11, VK11!);
  console.log('ok?', validZkp11);
  fs.writeFileSync('./src/groth16/zkp11.json', JSON.stringify(proof11), 'utf8');
  fs.writeFileSync('./src/groth16/vk11.json', JSON.stringify(VK11), 'utf8');
}

async function runZKP12() {
  const VK12 = await compileZKP(12);
  const gt = witnessTracker(11);

  const proof11 = await ZKP11Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp11.json', 'utf8')));

  const zkp12Input = new ZKP12Input({
  });

  const proof12 = await zkp12.compute(zkp12Input, gt!, proof11);

  console.log(proof12.publicOutput.gDigest);

  const validZkp12 = await verify(proof12, VK12!);
  console.log('ok?', validZkp12);
  fs.writeFileSync('./src/groth16/zkp12.json', JSON.stringify(proof12), 'utf8');
  fs.writeFileSync('./src/groth16/vk12.json', JSON.stringify(VK12), 'utf8');
}

async function runZKP13() {
  const VK13 = await compileZKP(13);
  const gt = witnessTracker(12);

  const proof12 = await ZKP12Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp12.json', 'utf8')));

  const zkp13Input = new ZKP13Input({
  });

  const proof13 = await zkp13.compute(zkp13Input, get_c_hint(), gt!, proof12);

  const validZkp13 = await verify(proof13, VK13!);
  console.log('ok?', validZkp13);
  fs.writeFileSync('./src/groth16/zkp13.json', JSON.stringify(proof13), 'utf8');
  fs.writeFileSync('./src/groth16/vk13.json', JSON.stringify(VK13), 'utf8');
}

async function runZKP14() {
  const VK14 = await compileZKP(14);
  const gt = witnessTracker(12);

  const proof13 = await ZKP13Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp13.json', 'utf8')));

  const zkp14Input = new ZKP14Input({
  });

  const proof14 = await zkp14.compute(zkp14Input, gt!, proof13);

  const validZkp14 = await verify(proof14, VK14!);
  console.log('ok?', validZkp14);
  fs.writeFileSync('./src/groth16/zkp14.json', JSON.stringify(proof14), 'utf8');
  fs.writeFileSync('./src/groth16/vk14.json', JSON.stringify(VK14), 'utf8');
}

async function runZKP15() {
  const VK15 = await compileZKP(15);
  const gt = witnessTracker(12);

  const proof14 = await ZKP14Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp14.json', 'utf8')));

  const zkp15Input = new ZKP15Input({
  });

  const proof15 = await zkp15.compute(zkp15Input, gt!, proof14);

  const validZkp15 = await verify(proof15, VK15!);
  console.log('ok?', validZkp15);
  fs.writeFileSync('./src/groth16/zkp15.json', JSON.stringify(proof15), 'utf8');
  fs.writeFileSync('./src/groth16/vk15.json', JSON.stringify(VK15), 'utf8');
}

async function runZKP16() {
  const VK16 = await compileZKP(16);
  const gt = witnessTracker(12);

  const proof15 = await ZKP15Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp15.json', 'utf8')));

  const zkp16Input = new ZKP16Input({
  });

  const proof16 = await zkp16.compute(zkp16Input, gt!, proof15);

  const validZkp16 = await verify(proof16, VK16!);
  console.log('ok?', validZkp16);
  fs.writeFileSync('./src/groth16/zkp16.json', JSON.stringify(proof16), 'utf8');
  fs.writeFileSync('./src/groth16/vk16.json', JSON.stringify(VK16), 'utf8');
}

async function runZKP17() {
  const VK17 = await compileZKP(17);
  const gt = witnessTracker(12);

  const proof16 = await ZKP16Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp16.json', 'utf8')));

  const zkp17Input = new ZKP17Input({
  });

  const proof17 = await zkp17.compute(zkp17Input, gt!, proof16);

  const validZkp17 = await verify(proof17, VK17!);
  console.log('ok?', validZkp17);
  fs.writeFileSync('./src/groth16/zkp17.json', JSON.stringify(proof17), 'utf8');
  fs.writeFileSync('./src/groth16/vk17.json', JSON.stringify(VK17), 'utf8');
}

async function runZKP18() {
  const VK18 = await compileZKP(18);
  const gt = witnessTracker(12);

  const proof17 = await ZKP17Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp17.json', 'utf8')));

  const zkp18Input = new ZKP18Input({
  });

  const proof18 = await zkp18.compute(zkp18Input, gt!, proof17);

  const validZkp18 = await verify(proof18, VK18!);
  console.log('ok?', validZkp18);
  fs.writeFileSync('./src/groth16/zkp18.json', JSON.stringify(proof18), 'utf8');
  fs.writeFileSync('./src/groth16/vk18.json', JSON.stringify(VK18), 'utf8');
}

async function runZKP19() {
  const VK19 = await compileZKP(19);
  const gt = witnessTracker(12);

  const proof18 = await ZKP18Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp18.json', 'utf8')));

  const zkp19Input = new ZKP19Input({
  });

  const proof19 = await zkp19.compute(zkp19Input, gt!, proof18);

  const validZkp19 = await verify(proof19, VK19!);
  console.log('ok?', validZkp19);
  fs.writeFileSync('./src/groth16/zkp19.json', JSON.stringify(proof19), 'utf8');
  fs.writeFileSync('./src/groth16/vk19.json', JSON.stringify(VK19), 'utf8');
}

async function runZKP20() {
  const VK20 = await compileZKP(20);
  const gt = witnessTracker(12);

  const proof19 = await ZKP19Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp19.json', 'utf8')));

  const zkp20Input = new ZKP20Input({
  });

  const proof20 = await zkp20.compute(zkp20Input, gt!, proof19);

  const validZkp20 = await verify(proof20, VK20!);
  console.log('ok?', validZkp20);
  fs.writeFileSync('./src/groth16/zkp20.json', JSON.stringify(proof20), 'utf8');
  fs.writeFileSync('./src/groth16/vk20.json', JSON.stringify(VK20), 'utf8');
}

async function runZKP21() {
  const VK21 = await compileZKP(21);
  const gt = witnessTracker(12);

  const proof20 = await ZKP20Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp20.json', 'utf8')));

  const zkp21Input = new ZKP21Input({
  });

  const proof21 = await zkp21.compute(zkp21Input, gt!, proof20);

  const validZkp21 = await verify(proof21, VK21!);
  console.log('ok?', validZkp21);
  fs.writeFileSync('./src/groth16/zkp21.json', JSON.stringify(proof21), 'utf8');
  fs.writeFileSync('./src/groth16/vk21.json', JSON.stringify(VK21), 'utf8');
}

async function runZKP22() {
  const VK22 = await compileZKP(22);
  const gt = witnessTracker(12);

  const proof21 = await ZKP21Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp21.json', 'utf8')));

  const zkp22Input = new ZKP22Input({
  });

  const proof22 = await zkp22.compute(zkp22Input, gt!, proof21);

  const validZkp22 = await verify(proof22, VK22!);
  console.log('ok?', validZkp22);
  fs.writeFileSync('./src/groth16/zkp22.json', JSON.stringify(proof22), 'utf8');
  fs.writeFileSync('./src/groth16/vk22.json', JSON.stringify(VK22), 'utf8');
}

async function runZKP23() {
  const VK23 = await compileZKP(23);
  const gt = witnessTracker(12);

  const proof22 = await ZKP22Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp22.json', 'utf8')));

  const zkp23Input = new ZKP23Input({
    alpha_beta: get_alpha_beta()
  });

  const w27 = make_w27(); 
  const w27_sq = w27.mul(w27);
  let non_residues = [Fp12.one(), w27, w27_sq];

  const proof23 = await zkp23.compute(zkp23Input, gt!, proof22, non_residues, Field("2"));

  const validZkp23 = await verify(proof23, VK23!);
  console.log('ok?', validZkp23);
  fs.writeFileSync('./src/groth16/zkp23.json', JSON.stringify(proof23), 'utf8');
  fs.writeFileSync('./src/groth16/vk23.json', JSON.stringify(VK23), 'utf8');
}

async function runZKP24() {
  const VK24 = await compileZKP(24);
  const gt = witnessTracker(12);

  const proof23 = await ZKP23Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp23.json', 'utf8')));

  const zkp24Input = new ZKP24Input({
    alpha_beta: get_alpha_beta()
  });

  const w27 = make_w27(); 
  const w27_sq = w27.mul(w27);
  let non_residues = [Fp12.one(), w27, w27_sq];

  const gamma_1s = [GAMMA_1S[0], GAMMA_1S[1], GAMMA_1S[2], GAMMA_1S[3], GAMMA_1S[4]]; 
  const gamma_2s = [GAMMA_2S[0], GAMMA_2S[1], GAMMA_2S[2], GAMMA_2S[3], GAMMA_2S[4]]; 
  const gamma_3s = [GAMMA_3S[0], GAMMA_3S[1], GAMMA_3S[2], GAMMA_3S[3], GAMMA_3S[4]]; 


  const proof24 = await zkp24.compute(zkp24Input, gamma_1s, gamma_2s, gamma_3s, gt!, proof23, non_residues, Field("2"));

  const validZkp24 = await verify(proof24, VK24!);
  console.log('ok?', validZkp24);
  fs.writeFileSync('./src/groth16/zkp24.json', JSON.stringify(proof24), 'utf8');
  fs.writeFileSync('./src/groth16/vk24.json', JSON.stringify(VK24), 'utf8');
}


async function proofReader() {
  const proof = await ZKP23Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp23.json', 'utf8')));
  proof.publicOutput.f.display("f");
}

switch (process.argv[2]) {
    case 'read': 
        await proofReader(); 
        break;
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
    case 'zkp13': 
        await runZKP13(); 
        break;
    case 'zkp14': 
        await runZKP14(); 
        break;
    case 'zkp15': 
        await runZKP15(); 
        break;
    case 'zkp16': 
        await runZKP16(); 
        break;
    case 'zkp17': 
        await runZKP17(); 
        break;
    case 'zkp18': 
        await runZKP18(); 
        break;
    case 'zkp19': 
        await runZKP19(); 
        break;    
    case 'zkp20': 
        await runZKP20(); 
        break;
    case 'zkp21': 
        await runZKP21(); 
        break;
    case 'zkp22': 
        await runZKP22(); 
        break;
    case 'zkp23': 
        await runZKP23(); 
        break;
    case 'zkp24': 
        await runZKP24(); 
        break;
}