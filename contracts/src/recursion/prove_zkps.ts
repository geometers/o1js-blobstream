import { Field, Poseidon, Provable, VerificationKey, verify } from "o1js";
import { zkp0, ZKP0Proof } from "./zkp0.js";
import { zkp1, ZKP1Proof } from "./zkp1.js";
import { zkp2, ZKP2Proof } from "./zkp2.js";
import { zkp3, ZKP3Proof } from "./zkp3.js";
import { getB, getBHardcodedLines, getBSlice, getC, getNegA, getPI, get_c_hint, make_w27 } from "./helpers.js";
import { WitnessTracker } from "./witness_trace.js";
import fs from 'fs';
import { Groth16Data } from "./data.js";
import { GAMMA_1S, NEG_GAMMA_13 } from "../towers/precomputed.js";
import { G2Line } from "../lines/index.js";
import { Fp12 } from "../towers/fp12.js";
import { Fp2 } from "../towers/fp2.js";
import { FpC } from "../towers/fp.js";
import { zkp4 } from "./zkp4.js";
import { zkp5 } from "./zkp5.js";
import { zkp6 } from "./zkp6.js";
import { zkp7 } from "./zkp7.js";
import { zkp8 } from "./zkp8.js";
import { ATE_LOOP_COUNT } from "../towers/consts.js";
import { zkp9 } from "./zkp9.js";

async function prove_zkp0() {
    const vk0 = (await zkp0.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let cin0 = Poseidon.hashPacked(Groth16Data, in0);

    const proof0 = await zkp0.compute(cin0, getBSlice(0), in0);
    const valid = await verify(proof0, vk0); 
    console.log("valid zkp0?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp0.json', JSON.stringify(proof0), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk0.json', JSON.stringify(vk0), 'utf8');
}


async function prove_zkp1() {
    const vk1 = (await zkp1.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);

    let cin1 = Poseidon.hashPacked(Groth16Data, in1);
    const proof1 = await zkp1.compute(cin1, in1, getBSlice(1));

    const valid = await verify(proof1, vk1); 
    console.log("valid zkp1?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp1.json', JSON.stringify(proof1), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk1.json', JSON.stringify(vk1), 'utf8');
}


async function prove_zkp2() {
    const vk2 = (await zkp2.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);
    let in2 = wt.zkp1(in1);

    let cin2 = Poseidon.hashPacked(Groth16Data, in2);
    const proof2 = await zkp2.compute(cin2, in2, getBSlice(2));

    const valid = await verify(proof2, vk2); 
    console.log("valid zkp2?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp2.json', JSON.stringify(proof2), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk2.json', JSON.stringify(vk2), 'utf8');
}

async function prove_zkp3() {
    const vk3 = (await zkp3.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);

    let cin3 = Poseidon.hashPacked(Groth16Data, in3);
    const proof3 = await zkp3.compute(cin3, in3);

    const valid = await verify(proof3, vk3); 
    console.log("valid zkp3?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp3.json', JSON.stringify(proof3), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk3.json', JSON.stringify(vk3), 'utf8');
}

async function prove_zkp4() {
    const vk4 = (await zkp4.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);
    let in4 = wt.zkp3(in3);

    let cin4 = Poseidon.hashPacked(Groth16Data, in4);
    const proof4 = await zkp4.compute(cin4, in4);

    const valid = await verify(proof4, vk4); 
    console.log("valid zkp4?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp4.json', JSON.stringify(proof4), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk4.json', JSON.stringify(vk4), 'utf8');
}

async function prove_zkp5() {
    const vk5 = (await zkp5.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);
    let in4 = wt.zkp3(in3);
    let in5 = wt.zkp4(in4);

    let cin5 = Poseidon.hashPacked(Groth16Data, in5);
    const proof5 = await zkp5.compute(cin5, in5);

    const valid = await verify(proof5, vk5); 
    console.log("valid zkp5?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp5.json', JSON.stringify(proof5), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk5.json', JSON.stringify(vk5), 'utf8');
}

async function prove_zkp6() {
    const vk6 = (await zkp6.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);
    let in4 = wt.zkp3(in3);
    let in5 = wt.zkp4(in4);
    let in6 = wt.zkp5(in5);

    let cin6 = Poseidon.hashPacked(Groth16Data, in6);
    const proof6 = await zkp6.compute(cin6, in6);

    const valid = await verify(proof6, vk6); 
    console.log("valid zkp6?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp6.json', JSON.stringify(proof6), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk6.json', JSON.stringify(vk6), 'utf8');
}

async function prove_zkp7() {
    const vk7 = (await zkp7.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);
    let in4 = wt.zkp3(in3);
    let in5 = wt.zkp4(in4);
    let in6 = wt.zkp5(in5);
    let in7 = wt.zkp6(in6);

    let cin7 = Poseidon.hashPacked(Groth16Data, in7);
    const proof7 = await zkp7.compute(cin7, in7);

    const valid = await verify(proof7, vk7); 
    console.log("valid zkp7?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp7.json', JSON.stringify(proof7), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk7.json', JSON.stringify(vk7), 'utf8');
}

async function prove_zkp8() {
    const vk8 = (await zkp8.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);
    let in4 = wt.zkp3(in3);
    let in5 = wt.zkp4(in4);
    let in6 = wt.zkp5(in5);
    let in7 = wt.zkp6(in6);
    let in8 = wt.zkp7(in7);

    let cin8 = Poseidon.hashPacked(Groth16Data, in8);
    const proof8 = await zkp8.compute(cin8, in8);

    const valid = await verify(proof8, vk8); 
    console.log("valid zkp8?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp8.json', JSON.stringify(proof8), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk8.json', JSON.stringify(vk8), 'utf8');
}

async function prove_zkp9() {
    const vk9 = (await zkp9.compile()).verificationKey;

    const wt = new WitnessTracker();
    let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27(), Field(0));
    let in1 = wt.zkp0(in0);
    let in2 = wt.zkp1(in1);
    let in3 = wt.zkp2(in2);
    let in4 = wt.zkp3(in3);
    let in5 = wt.zkp4(in4);
    let in6 = wt.zkp5(in5);
    let in7 = wt.zkp6(in6);
    let in8 = wt.zkp7(in7);

    // TODO!!!!! add witness tracker methods!!!!!!

    let cin9 = Poseidon.hashPacked(Groth16Data, in0);
    const proof9 = await zkp9.compute(cin9, in0);

    const valid = await verify(proof9, vk9); 
    console.log("valid zkp9?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp9.json', JSON.stringify(proof9), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk9.json', JSON.stringify(vk9), 'utf8');
}

switch(process.argv[2]) {
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
}