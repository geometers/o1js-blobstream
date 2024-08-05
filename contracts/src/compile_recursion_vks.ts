import fs from "fs";
import { Cache } from "o1js";
import { layer1 } from "./compressor/layer1node.js";
import { node } from "./compressor/compressor.js";

const workDir = process.argv[2];
const cacheDir = process.argv[3];

const layer1Vk = (await layer1.compile({cache: Cache.FileSystem(cacheDir)})).verificationKey; 
fs.writeFileSync(`${workDir}/vks/layer1Vk.json`, JSON.stringify(layer1Vk), 'utf8');

const nodeVk = (await node.compile({cache: Cache.FileSystem(cacheDir)})).verificationKey;
fs.writeFileSync(`${workDir}/vks/nodeVk.json`, JSON.stringify(nodeVk), 'utf8');
