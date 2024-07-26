import { VerificationKey } from "o1js";
import fs from "fs";
import { buildTreeOfVks } from "../../tree_of_vks.js";

const vk0 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk0.json', 'utf8'))).hash;
const vk1 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk1.json', 'utf8'))).hash;
const vk2 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk2.json', 'utf8'))).hash;
const vk3 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk3.json', 'utf8'))).hash;
const vk4 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk4.json', 'utf8'))).hash;
const vk5 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk5.json', 'utf8'))).hash;
const vk6 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk6.json', 'utf8'))).hash;
const vk7 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk7.json', 'utf8'))).hash;
const vk8 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk8.json', 'utf8'))).hash;
const vk9 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk9.json', 'utf8'))).hash;
const vk10 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk10.json', 'utf8'))).hash;
const vk11 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk11.json', 'utf8'))).hash;
const vk12 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk12.json', 'utf8'))).hash;
const vk13 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk13.json', 'utf8'))).hash;
const vk14 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk14.json', 'utf8'))).hash;
const vk15 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk15.json', 'utf8'))).hash;
const vk16 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk16.json', 'utf8'))).hash;
const vk17 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk17.json', 'utf8'))).hash;
const vk18 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/vk18.json', 'utf8'))).hash;

const layer1Vk = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/layer1Vk.json', 'utf8'))).hash;
const nodeVk = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync('./src/recursion/vks/nodeVk.json', 'utf8'))).hash;


const baseVksHashes = [vk0, vk1, vk2, vk3, vk4, vk5, vk6, vk7, vk8, vk9, vk10, vk11, vk12, vk13, vk14, vk15, vk16, vk17, vk18];
const root = await buildTreeOfVks(baseVksHashes, layer1Vk, nodeVk);

console.log(root.toBigInt());
