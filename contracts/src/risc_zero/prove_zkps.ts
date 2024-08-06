import { Poseidon, UInt64, verify, MerkleTree, Mina, AccountUpdate, Cache } from "o1js";
import { riscZeroExampleVerifier, RiscZeroExampleProof, RiscZeroExampleInput } from "./verify_risc_zero.js";
import { NodeProofLeft } from "../structs.js";
import fs from "fs";
import { ethers } from "ethers";

const args = process.argv;

async function prove_risc_zero_example() {
    const riscZeroExamplePlonkProofPath = args[3];
    const riscZeroExampleProofPath = args[4];
    const cacheDir = args[5];

    const blobstreamPlonkProof = await NodeProofLeft.fromJSON(JSON.parse(fs.readFileSync(riscZeroExamplePlonkProofPath, 'utf8')));

    const input = new RiscZeroExampleInput({
    });

    const vk = (await riscZeroExampleVerifier.compile({cache: Cache.FileSystem(cacheDir)})).verificationKey;

    const proof = await riscZeroExampleVerifier.compute(input, blobstreamPlonkProof);
    const valid = await verify(proof, vk); 

    fs.writeFileSync(riscZeroExampleProofPath, JSON.stringify(proof), 'utf8');
    console.log("valid risc zero proof?: ", valid);
}

switch(args[2]) {
    case 'blobstream':
        await prove_risc_zero_example();
        break;
}