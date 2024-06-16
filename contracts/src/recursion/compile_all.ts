import { node } from "../compressor/compressor.js";
import { layer1 } from "../compressor/layer1node.js";
import { zkp0 } from "./zkp0.js";
import { zkp1 } from "./zkp1.js";
import { zkp2 } from "./zkp2.js";
import { zkp3 } from "./zkp3.js";
import fs from "fs";

// const vk0 = (await zkp0.compile()).verificationKey; 
// fs.writeFileSync('./src/recursion/vks/vk0.json', JSON.stringify(vk0), 'utf8');

// const vk1 = (await zkp1.compile()).verificationKey; 
// fs.writeFileSync('./src/recursion/vks/vk1.json', JSON.stringify(vk1), 'utf8');

// const vk2 = (await zkp2.compile()).verificationKey; 
// fs.writeFileSync('./src/recursion/vks/vk2.json', JSON.stringify(vk2), 'utf8');

// const vk3 = (await zkp3.compile()).verificationKey;  
// fs.writeFileSync('./src/recursion/vks/vk3.json', JSON.stringify(vk3), 'utf8');

// const layer1Vk = (await layer1.compile()).verificationKey; 
// fs.writeFileSync('./src/recursion/vks/layer1Vk.json', JSON.stringify(layer1Vk), 'utf8');

const nodeVk = (await node.compile()).verificationKey;
fs.writeFileSync('./src/recursion/vks/nodeVk.json', JSON.stringify(nodeVk), 'utf8');
