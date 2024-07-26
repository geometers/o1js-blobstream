import { Field, Poseidon, Provable, VerificationKey, verify } from "o1js";
import { zkp0, ZKP0Proof } from "./zkp0.js";
import { zkp1, ZKP1Proof } from "./zkp1.js";
import { zkp2, ZKP2Proof } from "./zkp2.js";
import { zkp3, ZKP3Proof } from "./zkp3.js";
import { getB, getBHardcodedLines, getBSlice, getC, getNegA, getPI, get_c_hint, get_shift_power, make_w27 } from "./helpers.js";
import { WitnessTracker } from "./witness_trace.js";
import fs from 'fs';
import { Groth16Data } from "./data.js";
import { GAMMA_1S, NEG_GAMMA_13 } from "../../towers/precomputed.js";
import { G2Line } from "../../lines/index.js";
import { Fp12 } from "../../towers/fp12.js";
import { Fp2 } from "../../towers/fp2.js";
import { FpC } from "../../towers/fp.js";
import { zkp4 } from "./zkp4.js";
import { zkp5 } from "./zkp5.js";
import { zkp6 } from "./zkp6.js";
import { zkp7 } from "./zkp7.js";
import { zkp8 } from "./zkp8.js";
import { ATE_LOOP_COUNT } from "../../towers/consts.js";
import { zkp9 } from "./zkp9.js";
import { zkp10 } from "./zkp10.js";
import { zkp11 } from "./zkp11.js";
import { zkp12 } from "./zkp12.js";
import { zkp13 } from "./zkp13.js";
import { zkp14 } from "./zkp14.js";
import { zkp15 } from "./zkp15.js";
import { zkp16 } from "./zkp16.js";
import { zkp17 } from "./zkp17.js";
import { zkp18 } from "./zkp18.js";

const wt = new WitnessTracker();
let in0 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), Fp12.one(), get_shift_power());
let in1 = wt.zkp0(in0);
let in2 = wt.zkp1(in1);
let in3 = wt.zkp2(in2);
let in4 = wt.zkp3(in3);
let in5 = wt.zkp4(in4);
let in6 = wt.zkp5(in5);
let in7 = wt.zkp6(in6);
let in8 = wt.zkp7(in7);
let in9 = wt.zkp8(in8);
let in10 = wt.zkp9(in9);
let in11 = wt.zkp10(in10);
let in12 = wt.zkp11(in11);
let in13 = wt.zkp12(in12);
let in14 = wt.zkp13(in13);
let in15 = wt.zkp14(in14);
let in16 = wt.zkp15(in15);
let in17 = wt.zkp16(in16);
let in18 = wt.zkp17(in17);
wt.zkp18(in18);


async function prove_zkp0() {
    const vk0 = (await zkp0.compile()).verificationKey;
    let cin0 = Poseidon.hashPacked(Groth16Data, in0);

    const proof0 = await zkp0.compute(cin0, getBSlice(0), in0);
    const valid = await verify(proof0, vk0); 
    console.log("valid zkp0?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp0.json', JSON.stringify(proof0), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk0.json', JSON.stringify(vk0), 'utf8');
}


async function prove_zkp1() {
    const vk1 = (await zkp1.compile()).verificationKey;

    let cin1 = Poseidon.hashPacked(Groth16Data, in1);
    const proof1 = await zkp1.compute(cin1, in1, getBSlice(1));

    const valid = await verify(proof1, vk1); 
    console.log("valid zkp1?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp1.json', JSON.stringify(proof1), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk1.json', JSON.stringify(vk1), 'utf8');
}


async function prove_zkp2() {
    const vk2 = (await zkp2.compile()).verificationKey;

    let cin2 = Poseidon.hashPacked(Groth16Data, in2);
    const proof2 = await zkp2.compute(cin2, in2, getBSlice(2));

    const valid = await verify(proof2, vk2); 
    console.log("valid zkp2?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp2.json', JSON.stringify(proof2), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk2.json', JSON.stringify(vk2), 'utf8');
}

async function prove_zkp3() {
    const vk3 = (await zkp3.compile()).verificationKey;

    let cin3 = Poseidon.hashPacked(Groth16Data, in3);
    const proof3 = await zkp3.compute(cin3, in3);

    const valid = await verify(proof3, vk3); 
    console.log("valid zkp3?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp3.json', JSON.stringify(proof3), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk3.json', JSON.stringify(vk3), 'utf8');
}

async function prove_zkp4() {
    const vk4 = (await zkp4.compile()).verificationKey;

    let cin4 = Poseidon.hashPacked(Groth16Data, in4);
    const proof4 = await zkp4.compute(cin4, in4);

    const valid = await verify(proof4, vk4); 
    console.log("valid zkp4?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp4.json', JSON.stringify(proof4), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk4.json', JSON.stringify(vk4), 'utf8');
}

async function prove_zkp5() {
    const vk5 = (await zkp5.compile()).verificationKey;

    let cin5 = Poseidon.hashPacked(Groth16Data, in5);
    const proof5 = await zkp5.compute(cin5, in5);

    const valid = await verify(proof5, vk5); 
    console.log("valid zkp5?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp5.json', JSON.stringify(proof5), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk5.json', JSON.stringify(vk5), 'utf8');
}

async function prove_zkp6() {
    const vk6 = (await zkp6.compile()).verificationKey;

    let cin6 = Poseidon.hashPacked(Groth16Data, in6);
    const proof6 = await zkp6.compute(cin6, in6);

    const valid = await verify(proof6, vk6); 
    console.log("valid zkp6?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp6.json', JSON.stringify(proof6), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk6.json', JSON.stringify(vk6), 'utf8');
}

async function prove_zkp7() {
    const vk7 = (await zkp7.compile()).verificationKey;

    let cin7 = Poseidon.hashPacked(Groth16Data, in7);
    const proof7 = await zkp7.compute(cin7, in7);

    const valid = await verify(proof7, vk7); 
    console.log("valid zkp7?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp7.json', JSON.stringify(proof7), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk7.json', JSON.stringify(vk7), 'utf8');
}

async function prove_zkp8() {
    const vk8 = (await zkp8.compile()).verificationKey;

    let cin8 = Poseidon.hashPacked(Groth16Data, in8);
    const proof8 = await zkp8.compute(cin8, in8);

    const valid = await verify(proof8, vk8); 
    console.log("valid zkp8?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp8.json', JSON.stringify(proof8), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk8.json', JSON.stringify(vk8), 'utf8');
}

async function prove_zkp9() {
    const vk9 = (await zkp9.compile()).verificationKey;

    let cin9 = Poseidon.hashPacked(Groth16Data, in9);
    const proof9 = await zkp9.compute(cin9, in9);

    const valid = await verify(proof9, vk9); 
    console.log("valid zkp9?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp9.json', JSON.stringify(proof9), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk9.json', JSON.stringify(vk9), 'utf8');
}

async function prove_zkp10() {
    const vk10 = (await zkp10.compile()).verificationKey;

    let cin10 = Poseidon.hashPacked(Groth16Data, in10);
    const proof10 = await zkp10.compute(cin10, in10);

    const valid = await verify(proof10, vk10); 
    console.log("valid zkp10?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp10.json', JSON.stringify(proof10), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk10.json', JSON.stringify(vk10), 'utf8');
}

async function prove_zkp11() {
    const vk11 = (await zkp11.compile()).verificationKey;

    let cin11 = Poseidon.hashPacked(Groth16Data, in11);
    const proof11 = await zkp11.compute(cin11, in11);

    const valid = await verify(proof11, vk11); 
    console.log("valid zkp11?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp11.json', JSON.stringify(proof11), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk11.json', JSON.stringify(vk11), 'utf8');
}

async function prove_zkp12() {
    const vk12 = (await zkp12.compile()).verificationKey;

    let cin12 = Poseidon.hashPacked(Groth16Data, in12);
    const proof12 = await zkp12.compute(cin12, in12);

    const valid = await verify(proof12, vk12); 
    console.log("valid zkp12?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp12.json', JSON.stringify(proof12), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk12.json', JSON.stringify(vk12), 'utf8');
}

async function prove_zkp13() {
    const vk13 = (await zkp13.compile()).verificationKey;

    let cin13 = Poseidon.hashPacked(Groth16Data, in13);
    const proof13 = await zkp13.compute(cin13, in13);

    const valid = await verify(proof13, vk13); 
    console.log("valid zkp13?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp13.json', JSON.stringify(proof13), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk13.json', JSON.stringify(vk13), 'utf8');
}

async function prove_zkp14() {
    const vk14 = (await zkp14.compile()).verificationKey;

    let cin14 = Poseidon.hashPacked(Groth16Data, in14);
    const proof14 = await zkp14.compute(cin14, in14);

    const valid = await verify(proof14, vk14); 
    console.log("valid zkp14?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp14.json', JSON.stringify(proof14), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk14.json', JSON.stringify(vk14), 'utf8');
}

async function prove_zkp15() {
    const vk15 = (await zkp15.compile()).verificationKey;

    let cin15 = Poseidon.hashPacked(Groth16Data, in15);
    const proof15 = await zkp15.compute(cin15, in15);

    const valid = await verify(proof15, vk15); 
    console.log("valid zkp15?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp15.json', JSON.stringify(proof15), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk15.json', JSON.stringify(vk15), 'utf8');
}

async function prove_zkp16() {
    const vk16 = (await zkp16.compile()).verificationKey;

    let cin16 = Poseidon.hashPacked(Groth16Data, in16);
    const proof16 = await zkp16.compute(cin16, in16);

    const valid = await verify(proof16, vk16); 
    console.log("valid zkp16?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp16.json', JSON.stringify(proof16), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk16.json', JSON.stringify(vk16), 'utf8');
}

async function prove_zkp17() {
    const vk17 = (await zkp17.compile()).verificationKey;

    let cin17 = Poseidon.hashPacked(Groth16Data, in17);
    const proof17 = await zkp17.compute(cin17, in17);

    const valid = await verify(proof17, vk17); 
    console.log("valid zkp17?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp17.json', JSON.stringify(proof17), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk17.json', JSON.stringify(vk17), 'utf8');
}

async function prove_zkp18() {
    const vk18 = (await zkp18.compile()).verificationKey;

    let cin18 = Poseidon.hashPacked(Groth16Data, in18);
    const proof18 = await zkp18.compute(cin18, in18);

    const valid = await verify(proof18, vk18); 
    console.log("valid zkp18?: ", valid);

    fs.writeFileSync('./src/recursion/proofs/layer0/zkp18.json', JSON.stringify(proof18), 'utf8');
    fs.writeFileSync('./src/recursion/vks/vk18.json', JSON.stringify(vk18), 'utf8');
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
    case 'zkp16':
        await prove_zkp16();
        break;
    case 'zkp17':
        await prove_zkp17();
        break;
    case 'zkp18':
        await prove_zkp18();
        break;
}