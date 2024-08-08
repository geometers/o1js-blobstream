import {
    Field,
    PrivateKey,
    Provable,
    SmartContract,
    State,
    VerificationKey,
    method,
    state,
    Poseidon,
    UInt8,
    Bytes,
    Gadgets,
    ZkProgram,
    Struct,
    UInt64,
    Undefined,
  } from 'o1js';
import { FrC } from '../towers/index.js';
import { NodeProofLeft } from '../structs.js';
import { parseDigestProvable, parsePublicInputs, parsePublicInputsProvable } from '../plonk/parse_pi.js';
import { provableBn254ScalarFieldToBytes, wordToBytes } from '../sha/utils.js';
import fs from 'fs';
import { blob } from 'stream/consumers';
import { Bytes32 } from './verify_blobstream.js';

const blobInclusionProgramVk: FrC = FrC.from(process.env.BLOB_INCLUSION_PROGRAM_VK as string)
const workDir = process.env.BLOB_INCLUSION_WORK_DIR as string;

class BlobInclusionInput extends Struct({
    digest: Bytes32.provable,
}) {}

const blobInclusionVerifier = ZkProgram({
    name: 'blobInclusionVerifier',
    publicInput: BlobInclusionInput,
    publicOutput: Undefined,
    methods: {
      compute: {
        privateInputs: [NodeProofLeft],
        async method(
            input: BlobInclusionInput,
            proof: NodeProofLeft,
        ) {
            const blobInclusionNodeVk: Field = Field.from(JSON.parse(fs.readFileSync(`${workDir}/proofs/layer5/p0.json`, 'utf8')).publicOutput[2]);
            const vk = VerificationKey.fromJSON(JSON.parse(fs.readFileSync(`${workDir}/vks/nodeVk.json`, 'utf8')))

            proof.verify(vk)
            proof.publicOutput.subtreeVkDigest.assertEquals(blobInclusionNodeVk)

            const pi0 = blobInclusionProgramVk;
            const pi1 = parseDigestProvable(Bytes.from(input.digest));
            
            const piDigest = Poseidon.hashPacked(Provable.Array(FrC.provable, 2), [pi0, pi1])
            piDigest.assertEquals(proof.publicOutput.rightOut)

            return undefined;
        },
      },
    },
});

const BlobInclusionProof = ZkProgram.Proof(blobInclusionVerifier);
export { blobInclusionVerifier, BlobInclusionProof, BlobInclusionInput, Bytes32 };