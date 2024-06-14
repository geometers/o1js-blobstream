import { node } from "../compressor/compressor.js";
import { CIn, GenericProofLeft, GenericProofRight, GenericZkpLeft, GenericZkpRight, inpFromHashed, toDefaultInput, toDefaultOutput } from "../structs.js";
import { Field, Poseidon, Provable, VerificationKey, ZkProgram, Bool, verify } from "o1js";
import { ZKP1Proof, zkp1, ZKP1WrapperProof, zkp1Wrapper} from "./zkp1.js";
import { ZKP2Proof, zkp2 } from "./zkp2.js";
import fs from 'fs';
import { nodeLayer1 } from "../compressor/layer1node.js";
import { GenericZkp, dynamicWrapper } from "../compressor/dynamic_wrapper.js";
import { WitnessTracker } from "./witness_trace.js";
import { getB, getBSlice, getC, getNegA, getPI, get_c_hint, make_w27 } from "./helpers.js";
import { Groth16Data } from "./data.js";

const pairIndex = parseInt(process.argv[2]);

// const proofLeft = await ZKP1Proof.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/zkp${2*(pairIndex - 1) + 1}.json`, 'utf8')));
// const vkLeft = VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/vk${2*(pairIndex - 1) + 1}.json`, 'utf8')));
// let proofLeft = GenericZkpLeft.fromProof(await ZKP1Proof.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/zkp${2*(pairIndex - 1) + 1}.json`, 'utf8'))));
// const dummyLeft = await GenericZkpLeft.dummy(toDefaultInput(), toDefaultOutput(Field(0)), 0);

// proofLeft.publicInput = dummyLeft.publicInput;
// proofLeft.publicOutput = dummyLeft.publicOutput;
// proofLeft.maxProofsVerified = dummyLeft.maxProofsVerified;
// proofLeft.proof = dummyLeft.proof;

// let [, proof] = Pickles.proofOfBase64(proofLeft, 0);
// console.log(JSON.stringify(proof))
// let type = getStatementType(this);

// console.log('going to verify');
// const valid = await verify(proofLeft, vkLeft); 
// console.log('zkp1 valid', valid);
const vkLeft = (await zkp1.compile()).verificationKey; 
console.log("cached");

const wt = new WitnessTracker();
let in1 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27());
let cin1 = inpFromHashed(Poseidon.hashPacked(Groth16Data, in1));

const proofLeft = await zkp1.compute(cin1, getBSlice(0), in1);
let valid = await verify(proofLeft, vkLeft); 
console.log("is valid 1: ", valid);

const vkZkp1Wrapper = (await zkp1Wrapper.compile()).verificationKey; 
const wrappedProof = await zkp1Wrapper.compute(cin1, proofLeft);
valid = await verify(wrappedProof, vkZkp1Wrapper); 
console.log("is valid zkp 1 wrapper: ", valid);

const dyProof = GenericZkp.fromProof(wrappedProof);
const dyVk = (await dynamicWrapper.compile()).verificationKey;
const proofDynamicWrapper = await dynamicWrapper.compute(cin1, dyProof, vkLeft);
valid = await verify(proofDynamicWrapper, dyVk); 
console.log("is valid zkp 1 wrapper: ", valid);

const nodeVk = (await node.compile()).verificationKey; 
await node.compute(toDefaultInput(), proofDynamicWrapper)

// const proofRight = await GenericZkpRight.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/zkp${2*(pairIndex - 1) + 2}.json`, 'utf8')));
// const vkRight = VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/vk${2*(pairIndex - 1) + 2}.json`, 'utf8')));

// const vk1 = (await zkp1.compile()).verificationKey; 
// console.log("cached");

// const wt = new WitnessTracker();
// let in1 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27());
// let cin1 = inpFromHashed(Poseidon.hashPacked(Groth16Data, in1));

// const proof1 = await zkp1.compute(cin1, getBSlice(0), in1);
// let valid = await verify(proof1, vk1); 
// console.log("is valid 1: ", valid);

// const vk2 = (await zkp2.compile()).verificationKey; 
// console.log("cached");

// in1 = wt.init(getNegA(), getB(), getC(), getPI(), get_c_hint(), make_w27());
// let in2 = wt.zkp1(in1);

// let cin2 = inpFromHashed(Poseidon.hashPacked(Groth16Data, in2));
// const proof2 = await zkp2.compute(cin2, in2, getBSlice(1));

// valid = await verify(proof2, vk2); 
// console.log("valid zkp2?: ", valid);

// const layer1vk = (await nodeLayer1.compile()).verificationKey; 

// let pl = GenericZkpLeft.fromProof(proof1);
// let pr = GenericZkpRight.fromProof(proof2);

// const layer1vk = (await nodeLayer1.compile()).verificationKey; 
// const ll = await nodeLayer1.compute(Bool(false), GenericZkpLeft.fromProof(proofLeft), vkLeft, Bool(false), await GenericZkpRight.dummy(toDefaultInput(), toDefaultOutput(Field(0)), 0), vkLeft);

