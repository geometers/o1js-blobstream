import fs from "fs";
import { ZKP1Proof } from "./zkp1.js";
import { ZKP2Proof } from "./zkp2.js";
import { ZKP3Proof } from "./zkp3.js";
import { ZKP4Proof } from "./zkp4.js";
import { Field, VerificationKey } from "o1js";
import { layer1 } from "../compressor/layer1node.js";
import { NodeProofLeft, NodeProofRight, ZkpProofLeft, ZkpProofRight } from "../structs.js";
import { node } from "../compressor/compressor.js";
import { buildTreeOfVks } from "../tree_of_vks.js";

console.log("begin")

const p1 = await ZKP1Proof.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/proofs/zkp1.json', 'utf8')));
const p2 = await ZKP2Proof.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/proofs/zkp2.json', 'utf8')));
const p3 = await ZKP3Proof.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/proofs/zkp3.json', 'utf8')));
const p4 = await ZKP4Proof.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/proofs/zkp4.json', 'utf8')));

const vk1 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/proofs/vk1.json', 'utf8')));
const vk2 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/proofs/vk2.json', 'utf8')));
const vk3 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/proofs/vk3.json', 'utf8')));
const vk4 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/proofs/vk4.json', 'utf8')));

console.log("zkps prepared")

const layer1Vk = (await layer1.compile()).verificationKey; 

const l1 = await layer1.compute(ZkpProofLeft.fromProof(p1), vk1, ZkpProofRight.fromProof(p2), vk2);
const l2 = await layer1.compute(ZkpProofLeft.fromProof(p3), vk3, ZkpProofRight.fromProof(p4), vk4);

console.log("layers proof done");

const nodeVk = (await node.compile()).verificationKey;

const n1 = await node.compute(NodeProofLeft.fromProof(l1), layer1Vk, NodeProofRight.fromProof(l2), layer1Vk, nodeVk.hash, Field(2));

console.log("node proofs done");

const root = buildTreeOfVks([vk1.hash, vk2.hash, vk3.hash, vk4.hash], layer1Vk.hash, nodeVk.hash)
