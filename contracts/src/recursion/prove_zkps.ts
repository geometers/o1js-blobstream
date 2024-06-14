import { Field, Poseidon, verify } from "o1js";
import { zkp1, ZKP1Proof } from "./zkp1.js";
import { zkp2, ZKP2Proof } from "./zkp2.js";
import { zkp3, ZKP3Proof } from "./zkp3.js";
import { zkp4, ZKP4Proof } from "./zkp4.js";
import { getB, getBHardcodedLines, getBSlice, getC, getNegA, getPI, get_c_hint, make_w27 } from "./helpers.js";
import { WitnessTracker } from "./witness_trace.js";
import fs from 'fs';
import { Groth16Data } from "./data.js";
import { GAMMA_1S, NEG_GAMMA_13 } from "../towers/precomputed.js";
import { G2Line } from "../lines/index.js";
import { Fp12 } from "../towers/fp12.js";
import { Fp2 } from "../towers/fp2.js";
import { FpC } from "../towers/fp.js";

async function prove_zkp1() {
    const vk1 = (await zkp1.compile()).verificationKey; 
    console.log("cached");

    const wt = new WitnessTracker();
    let in1 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27());
    let cin1 = Poseidon.hashPacked(Groth16Data, in1);

    const proof1 = await zkp1.compute(cin1, getBSlice(0), in1);
    const valid = await verify(proof1, vk1); 

    console.log("valid zkp1?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/zkp1.json', JSON.stringify(proof1), 'utf8');
    fs.writeFileSync('./src/recursion/proofs/vk1.json', JSON.stringify(vk1), 'utf8');
}


async function prove_zkp2() {
    const vk2 = (await zkp2.compile()).verificationKey; 
    console.log("cached");

    const wt = new WitnessTracker();
    let in1 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27());
    let in2 = wt.zkp1(in1);

    let cin2 = Poseidon.hashPacked(Groth16Data, in2);
    const proof2 = await zkp2.compute(cin2, in2, getBSlice(1));

    const valid = await verify(proof2, vk2); 
    console.log("valid zkp2?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/zkp2.json', JSON.stringify(proof2), 'utf8');
    fs.writeFileSync('./src/recursion/proofs/vk2.json', JSON.stringify(vk2), 'utf8');
}


async function prove_zkp3() {
    const vk3 = (await zkp3.compile()).verificationKey; 
    const wt = new WitnessTracker();
    let in1 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27());
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);

    let cin3 = Poseidon.hashPacked(Groth16Data, in3);
    const proof3 = await zkp3.compute(cin3, in3, getBSlice(2));

    const valid = await verify(proof3, vk3); 
    console.log("valid zkp3?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/zkp3.json', JSON.stringify(proof3), 'utf8');
    fs.writeFileSync('./src/recursion/proofs/vk3.json', JSON.stringify(vk3), 'utf8');
}

async function prove_zkp4() {
    const vk4 = (await zkp4.compile()).verificationKey; 
    const wt = new WitnessTracker();
    let in1 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27());
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);
    let in4 = wt.zkp3(in3);

    let cin4 = Poseidon.hashPacked(Groth16Data, in4);
    const proof4 = await zkp4.compute(cin4, in4, getBSlice(3));

    const valid = await verify(proof4, vk4); 
    console.log("valid zkp4?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/zkp4.json', JSON.stringify(proof4), 'utf8');
    fs.writeFileSync('./src/recursion/proofs/vk4.json', JSON.stringify(vk4), 'utf8');
}

switch(process.argv[2]) {
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
}