import { Poseidon, UInt64, verify } from "o1js";
import { blobstreamVerifier, BlobstreamProof, BlobstreamInput, Bytes32 } from "./verify_blobstream.js";
import { NodeProofLeft } from "../structs.js";
import fs from "fs";
import { ethers } from "ethers";

const args = process.argv;

interface sp1JSON {
    proof: {
        public_inputs: [string],
        encoded_proof: string,
        raw_proof: string,
    },
    public_values: {
        buffer: {
            data: Uint8Array,
        }
    }
}

async function prove_blobstream() {
    const blobstreamPlonkProofPath = args[3]
    const blobstreamSP1ProofPath = args[4]

    const blobstreamPlonkProof = await NodeProofLeft.fromJSON(JSON.parse(fs.readFileSync(blobstreamPlonkProofPath, 'utf8')));

    const blobstreamSP1Proof = JSON.parse(fs.readFileSync(blobstreamSP1ProofPath, 'utf8'));
    const defaultEncoder = ethers.AbiCoder.defaultAbiCoder()
    const decoded = defaultEncoder.decode(
        ['bytes32', 'bytes32', 'bytes32', 'uint64', 'uint64', 'bytes32'],
        Buffer.from(blobstreamSP1Proof.public_values.buffer.data),
    );

    const input = new BlobstreamInput({
        trustedHeaderHash: Bytes32.fromHex(decoded[0].slice(2)),
        targetHeaderHash: Bytes32.fromHex(decoded[1].slice(2)),
        dataCommitment: Bytes32.fromHex(decoded[2].slice(2)),
        trustedBlockHeight: UInt64.from(decoded[3]),
        targetBlockHeight: UInt64.from(decoded[4]),
        validatorBitmap: Bytes32.fromHex(decoded[5].slice(2)),
    });

    const vk = (await blobstreamVerifier.compile()).verificationKey;

    const proof = await blobstreamVerifier.compute(input, blobstreamPlonkProof);
    const valid = await verify(proof, vk); 
    console.log("valid blobstream proof?: ", valid);
}

switch(process.argv[2]) {
    case 'blobstream':
        await prove_blobstream();
        break;
}