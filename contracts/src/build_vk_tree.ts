import { VerificationKey } from "o1js";
import fs from "fs";
import { buildTreeOfVks } from "./tree_of_vks.js";

const workDir = process.argv[2];

const vk0 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk0.json`, 'utf8'))).hash;
const vk1 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk1.json`, 'utf8'))).hash;
const vk2 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk2.json`, 'utf8'))).hash;
const vk3 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk3.json`, 'utf8'))).hash;
const vk4 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk4.json`, 'utf8'))).hash;
const vk5 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk5.json`, 'utf8'))).hash;
const vk6 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk6.json`, 'utf8'))).hash;
const vk7 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk7.json`, 'utf8'))).hash;
const vk8 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk8.json`, 'utf8'))).hash;
const vk9 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk9.json`, 'utf8'))).hash;
const vk10 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk10.json`, 'utf8'))).hash;
const vk11 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk11.json`, 'utf8'))).hash;
const vk12 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk12.json`, 'utf8'))).hash;
const vk13 = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/vk13.json`, 'utf8'))).hash;


const layer1Vk = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/layer1Vk.json`, 'utf8'))).hash;
const nodeVk = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/nodeVk.json`, 'utf8'))).hash;


const baseVksHashes = [vk0, vk1, vk2, vk3, vk4, vk5, vk6, vk7, vk8, vk9, vk10, vk11, vk12, vk13];
const root = await buildTreeOfVks(baseVksHashes, layer1Vk, nodeVk);

console.log(root.toBigInt());
