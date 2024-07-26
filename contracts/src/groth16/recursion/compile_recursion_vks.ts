import { node } from "../../compressor/compressor.js";
import { layer1 } from "../../compressor/layer1node.js";
import fs from "fs";

const layer1Vk = (await layer1.compile()).verificationKey; 
fs.writeFileSync('./src/recursion/vks/layer1Vk.json', JSON.stringify(layer1Vk), 'utf8');

const nodeVk = (await node.compile()).verificationKey;
fs.writeFileSync('./src/recursion/vks/nodeVk.json', JSON.stringify(nodeVk), 'utf8');
