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
import { getBHardcodedLines, getNegA, getB, getC } from './helpers.js';
import { GAMMA_1S, GAMMA_2S, NEG_GAMMA_13 } from '../towers/precomputed.js';
import { ATE_LOOP_COUNT, Fp12, Fp2, FpC } from '../towers/index.js';
import { GWitnessTracker } from './g_witness_tracker.js';
import fs from 'fs';

async function runZKP1() {
    const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
    const ZKP1Proof = ZkProgram.Proof(zkp1);
    const bLines = getBHardcodedLines();

    let zkp1Input = new ZKP1Input({
      negA: getNegA(), 
      b: getB()
    });

    const proof1 = await zkp1.compute(zkp1Input, bLines.slice(0, 62)); // return 55
    const validZkp1 = await verify(proof1, VK1);
    console.log('ok?', validZkp1);
    console.log(proof1)
    fs.writeFileSync('./src/groth16/zkp1.json', JSON.stringify(proof1), 'utf8');
    fs.writeFileSync('./src/groth16/vk1.json', JSON.stringify(VK1), 'utf8');
}

async function runZKP2() {
    const VK1 = (await zkp1.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
    const VK2 = (await zkp2.compile({ cache: Cache.FileSystem('./groth16_cache') })).verificationKey;
    const ZKP2Proof = ZkProgram.Proof(zkp2);

    const bLines = getBHardcodedLines();


    const proof1 = await ZKP1Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp1.json', 'utf8')));
    const validZkp1 = await verify(proof1, VK1);
    console.log('ok?', validZkp1);
    // console.log(proof1)

    const gt = new GWitnessTracker();
    const g = gt.zkp1(getNegA(), bLines, getB());

    console.log(Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g))

    console.log('---------------------')
    console.log(proof1.publicOutput.gDigest);

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
  const bLines = getBHardcodedLines();

  let zkp1Input = new ZKP1Input({
    negA: getNegA(),
    b: getB()
  });
  
  const gt = new GWitnessTracker();
  let g = gt.zkp1(getNegA(), bLines, getB());
  
//   console.log(Poseidon.hashPacked(Provable.Array(Fp12, ATE_LOOP_COUNT.length), g))
  
//   console.log('---------------------')
//   console.log(proof1.publicOutput.gDigest);
  
  const proof1 = await ZKP1Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp1.json', 'utf8')));
  const proof2 = await ZKP2Proof.fromJSON(JSON.parse(fs.readFileSync('./src/groth16/zkp2.json', 'utf8')));
  console.log(proof2)
  const validZkp2 = await verify(proof2, VK2);
  console.log('ok?', validZkp2);

  g = gt.zkp2(g, getNegA(), bLines.slice(62, 62 + 29), getB(), proof1.publicOutput.T);

  const zkp3Input = new ZKP3Input({
    C: getC()
  });
  console.log("compute zkp3", g.length);
  const proof3 = await  zkp3.compute(zkp3Input, g, proof2); //zkp3.compute(zkp3Input, g, proof2);
  console.log("verify zkp3");
  const validZkp3 = await verify(proof3, VK3);
  console.log('ok?', validZkp3);

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

}