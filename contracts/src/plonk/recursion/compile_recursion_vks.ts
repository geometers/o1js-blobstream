import fs from "fs";
import { layer1 } from "../../compressor/layer1node.js";
import { node } from "../../compressor/compressor.js";

const layer1Vk = (await layer1.compile()).verificationKey; 
fs.writeFileSync('./src/plonk/recursion/vks/layer1Vk.json', JSON.stringify(layer1Vk), 'utf8');

const nodeVk = (await node.compile()).verificationKey;
fs.writeFileSync('./src/plonk/recursion/vks/nodeVk.json', JSON.stringify(nodeVk), 'utf8');
