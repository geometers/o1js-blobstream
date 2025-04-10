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
import {
  parsePublicInputs,
  parsePublicInputsProvable,
} from '../plonk/parse_pi.js';
import { provableBn254ScalarFieldToBytes, wordToBytes } from '../sha/utils.js';
import fs from 'fs';

class Bytes32 extends Bytes(32) {}

class BlobstreamInput extends Struct({
  trustedHeaderHash: Bytes32.provable,
  targetHeaderHash: Bytes32.provable,
  dataCommitment: Bytes32.provable,
  trustedBlockHeight: UInt64,
  targetBlockHeight: UInt64,
  validatorBitmap: Bytes32.provable,
}) {}

const padUInt64To32Bytes = (num: UInt64): UInt8[] => {
  const unpadded = wordToBytes(num.toFields()[0]);
  return [...unpadded, ...Array(24).fill(UInt8.from(0))].reverse();
};

const blobstreamVerifier = ZkProgram({
  name: 'blobstreamVerifier',
  publicInput: BlobstreamInput,
  publicOutput: Undefined,
  methods: {
    compute: {
      privateInputs: [NodeProofLeft],
      async method(input: BlobstreamInput, proof: NodeProofLeft) {
        let blobstreamProgramVk: FrC;
        let blobstreamNodeVk: Field;
        let vk: VerificationKey;

        if (process.env.BLOBSTREAM_ENABLED == 'true') {
          blobstreamProgramVk = FrC.from(
            process.env.BLOBSTREAM_PROGRAM_VK as string
          );
          const workDir = process.env.BLOBSTREAM_WORK_DIR as string;

          blobstreamNodeVk = Field.from(
            JSON.parse(
              fs.readFileSync(`${workDir}/proofs/layer5/p0.json`, 'utf8')
            ).publicOutput[2]
          );
          vk = VerificationKey.fromJSON(
            JSON.parse(fs.readFileSync(`${workDir}/vks/nodeVk.json`, 'utf8'))
          );
        } else {
          blobstreamProgramVk = FrC.from(0n);
          blobstreamNodeVk = Field.from(0n);
          vk = VerificationKey.empty();
        }

        proof.verify(vk);
        proof.publicOutput.subtreeVkDigest.assertEquals(blobstreamNodeVk);

        let bytes: UInt8[] = [];
        bytes = bytes.concat(input.trustedHeaderHash.bytes);
        bytes = bytes.concat(input.targetHeaderHash.bytes);
        bytes = bytes.concat(input.dataCommitment.bytes);
        bytes = bytes.concat(padUInt64To32Bytes(input.trustedBlockHeight));
        bytes = bytes.concat(padUInt64To32Bytes(input.targetBlockHeight));
        bytes = bytes.concat(input.validatorBitmap.bytes);

        const pi0 = blobstreamProgramVk;
        const pi1 = parsePublicInputsProvable(Bytes.from(bytes));

        const piDigest = Poseidon.hashPacked(Provable.Array(FrC.provable, 2), [
          pi0,
          pi1,
        ]);
        piDigest.assertEquals(proof.publicOutput.rightOut);

        return undefined;
      },
    },
  },
});

const BlobstreamProof = ZkProgram.Proof(blobstreamVerifier);
export { blobstreamVerifier, BlobstreamProof, BlobstreamInput, Bytes32 };
