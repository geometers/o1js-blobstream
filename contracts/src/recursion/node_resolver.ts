import { Bool, VerificationKey } from "o1js";
import fs from "fs";
import { NodeProofLeft, NodeProofRight, ZkpProofLeft, ZkpProofRight } from "../structs";
import { layer1 } from "../compressor/layer1node";
import { node } from "../compressor/compressor";

const NUM_OF_ZKPS = 4;

enum LeftOrRight {
    LEFT, 
    RIGHT
}

const resolveLeaf = async (index: number, side: LeftOrRight): Promise<ZkpProofLeft | ZkpProofRight> => {
    // if index is gt than number of zkps just make dummy proof with last proof input/output
    if (index >= NUM_OF_ZKPS) {
        const pLast = await ZkpProofLeft.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/layer0/zkp${NUM_OF_ZKPS}.json`, 'utf8')));

        if (side === LeftOrRight.LEFT) {
            return ZkpProofLeft.dummy(pLast.publicInput, pLast.publicOutput, 0); 
        } else {
            return ZkpProofRight.dummy(pLast.publicInput, pLast.publicOutput, 0);
        }
    }

    if (side === LeftOrRight.LEFT) {
        return await ZkpProofLeft.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/layer0/zkp${index}.json`, 'utf8'))); 
    } else {
        return await ZkpProofRight.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/layer0/zkp${index}.json`, 'utf8')));
    }
}

const resolveLeafVk = async (index: number): Promise<VerificationKey> => {
    // if dummy then just return vk0
    if (index >= NUM_OF_ZKPS) {
        return await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/vks/vk${0}.json`, 'utf8')));
    }

    return await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/vks/vk${index}.json`, 'utf8')));
}

const proveLayer1 = async (index: number) => {
    await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/vks/layer1Vk.json`, 'utf8')));

    const leftIdx = index * 2; 
    const rightIdx = leftIdx + 1; 

    const vkLeft = await resolveLeafVk(leftIdx);
    const vkRight = await resolveLeafVk(rightIdx);

    const piLeft = await resolveLeaf(leftIdx, LeftOrRight.LEFT);
    const piRight = await resolveLeaf(rightIdx, LeftOrRight.RIGHT);

    let verifyLeft = Bool(true); 
    let verifyRight = Bool(true); 

    if (leftIdx >= NUM_OF_ZKPS) {
        verifyLeft = Bool(false);
    }

    if (rightIdx >= NUM_OF_ZKPS) {
        verifyRight = Bool(false);
    }

    const proof = await layer1.compute(piLeft, vkLeft, verifyLeft, piRight, vkRight, verifyRight);
    fs.writeFileSync('./src/recursion/proofs/layer1/zkp4.json', JSON.stringify(proof), 'utf8');
}


const prove = async (layer: number, index: number) => {
    if (layer === 1) {
        proveLayer1(index);
    }

    const leftIdx = index * 2; 
    const rightIdx = leftIdx + 1; 

    const piLeft = await NodeProofLeft.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/layer${layer - 1}/n${leftIdx}.json`, 'utf8')));
    const piRight = await NodeProofRight.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/proofs/layer${layer - 1}/n${rightIdx}.json`, 'utf8')));

    const nodeVk = await VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`./src/recursion/vks/nodeVk.json`, 'utf8')));

    // // const proof = await node.compute(piLeft, nodeVk, verifyLeft, piRight, vkRight, verifyRight);
    // const proof = await node.compute(piLeft, layer1Vk, piRight, layer1Vk, nodeVk.hash, Field(2));
    // fs.writeFileSync('./src/recursion/proofs/layer1/zkp4.json', JSON.stringify(proof), 'utf8');
}

prove(parseInt(process.argv[2]), parseInt(process.argv[3]))