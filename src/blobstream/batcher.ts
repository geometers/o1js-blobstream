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
  SelfProof,
  Proof,
  UInt32,
  FeatureFlags,
  DynamicProof,
  Bool,
} from 'o1js';
import { FrC } from '../towers/index.js';
import { NodeProofLeft } from '../structs.js';
import {
  parsePublicInputs,
  parsePublicInputsProvable,
} from '../plonk/parse_pi.js';
import {
  bytesToWord,
  provableBn254ScalarFieldToBytes,
  wordToBytes,
} from '../sha/utils.js';
import fs from 'fs';
import { blob } from 'stream/consumers';
import { Bytes32 } from './verify_blobstream.js';
import {
  BlobInclusionInput,
  BlobInclusionProof,
} from './verify_blob_inclusion.js';

const workDir = process.env.BLOB_INCLUSION_WORK_DIR as string;

class Bytes29 extends Bytes(29) {}
class Bytes64 extends Bytes(64) {}

const BLOB_SIZE = 212;
const Bytes289Padding = [
  UInt8.from(0x80n),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0),
  UInt8.from(0x09n),
  UInt8.from(0x08n),
];

class BatcherInput extends Struct({
  currentStateHash: Field,
  index: Field,
  namespace: Bytes29.provable,
  currentRollingHash: Provable.Array(Field, 2),
  batcherVkHash: Field,
  blobInclusionVkHash: Field,
}) {}

class BatcherOutput extends Struct({
  initialStateHash: Field,
  currentStateHash: Field,
  currentRollingHash: Provable.Array(Field, 2),
  dataCommitment: Bytes32.provable,
}) {}

const NUM_PROOFS = 5;

function bytesToField(bs: UInt8[]): Field {
  return bs.reduce((acc, byte, idx) => {
    const shift = 1n << BigInt(8 * idx);
    return acc.add(byte.value.mul(shift));
  }, Field.from(0));
}

function halfHashToField(nums: UInt32[]): Field {
  return nums.reduce((acc, byte, idx) => {
    const shift = 1n << BigInt(32 * idx);
    return acc.add(byte.value.mul(shift));
  }, Field.from(0));
}

function hashToFields(hash: UInt32[]): Array<Field> {
  let firstHalf = halfHashToField(hash.slice(0, 4));
  let secondHalf = halfHashToField(hash.slice(4, 8));

  return [firstHalf, secondHalf];
}

function fieldToHalfHash(f: Field): UInt32[] {
  let nums = Provable.witness(Provable.Array(UInt32, 4), () => {
    let w = f.toBigInt();
    return Array.from({ length: 4 }, (_, k) =>
      UInt32.from((w >> BigInt(32 * k)) & 0xffffffffn)
    );
  });

  // check decomposition
  halfHashToField(nums).assertEquals(f);

  return nums;
}

function fieldsToHash(f: Array<Field>): UInt32[] {
  return fieldToHalfHash(f[0]).concat(fieldToHalfHash(f[1]));
}

class BatcherDynamicProof extends DynamicProof<BatcherInput, BatcherOutput> {
  static publicInputType = BatcherInput;
  static publicOutputType = BatcherOutput;
  static maxProofsVerified = 2 as const;

  static featureFlags = FeatureFlags.allMaybe;
}

class BlobInclusionDynamicProof extends DynamicProof<
  BlobInclusionInput,
  Undefined
> {
  static publicInputType = BlobInclusionInput;
  static publicOutputType = Undefined;
  static maxProofsVerified = 1 as const;

  static featureFlags = FeatureFlags.allMaybe;
}

const batcherVerifier = ZkProgram({
  name: 'batcherVerifier',
  publicInput: BatcherInput,
  publicOutput: BatcherOutput,
  methods: {
    compute: {
      privateInputs: [
        BatcherDynamicProof,
        VerificationKey,
        BlobInclusionDynamicProof,
        VerificationKey,
        Field,
        Bytes64.provable,
      ],
      async method(
        input: BatcherInput,
        previousProof: BatcherDynamicProof,
        batcherVk: VerificationKey,
        blobInclusionProof: BlobInclusionDynamicProof,
        blobInclusionVk: VerificationKey,
        counter: Field,
        incrementByBytes: Bytes64
      ) {
        const isFirst = input.index.equals(Field(0));
        const isNotFirst = isFirst.not();
        Provable.assertEqualIf(
          isNotFirst,
          Field,
          input.index,
          previousProof.publicInput.index.add(Field(1))
        );
        previousProof.verifyIf(batcherVk, isNotFirst);
        Provable.assertEqualIf(
          isNotFirst,
          Field,
          input.batcherVkHash,
          batcherVk.hash
        );
        Provable.assertEqualIf(
          isNotFirst,
          Field,
          previousProof.publicInput.batcherVkHash,
          batcherVk.hash
        );
        const isLast = input.index.equals(Field(NUM_PROOFS - 1));

        input.currentStateHash.assertEquals(
          Poseidon.hashPacked(Field, counter)
        );

        let namespaceBytes: UInt8[] = [];
        namespaceBytes = namespaceBytes.concat([
          UInt8.from(29n),
          ...Array(7).fill(UInt8.from(0)),
        ]);
        namespaceBytes = namespaceBytes.concat(input.namespace.bytes);
        namespaceBytes = namespaceBytes.concat([
          UInt8.from(BLOB_SIZE),
          ...Array(7).fill(UInt8.from(0)),
        ]);
        namespaceBytes = namespaceBytes.concat(
          incrementByBytes.bytes.slice(45)
        );

        let lastBlockBytes: UInt8[] = incrementByBytes.bytes.slice(0, 33);
        lastBlockBytes = lastBlockBytes.concat(Bytes289Padding);

        let bytesToHash = Provable.if(
          isFirst,
          Bytes64.provable,
          Bytes64.from(namespaceBytes),
          Provable.if(
            isLast,
            Bytes64.provable,
            Bytes64.from(lastBlockBytes),
            incrementByBytes
          )
        );

        // Provable.asProver(() => {
        //   console.log(`bytes to hash ${input.index.toBigInt()}: ${Buffer.from(bytesToHash.toBytes()).toString('hex')}`);
        // });

        const dataCommitment = incrementByBytes.bytes.slice(1, 33);
        const chunks = [];
        for (let i = 0; i < bytesToHash.length; i += 4) {
          const chunk = UInt32.Unsafe.fromField(
            bytesToWord(bytesToHash.bytes.slice(i, i + 4).reverse())
          );
          chunks.push(chunk);
        }

        let initialStateFields = hashToFields(Gadgets.SHA256.initialState);
        const currentH = Provable.if(
          isFirst,
          Provable.Array(Field, 2),
          initialStateFields,
          input.currentRollingHash
        );

        let W = Gadgets.SHA256.createMessageSchedule(chunks);
        let H = fieldsToHash(currentH);
        H = Gadgets.SHA256.compression(H, W);

        const numToAdd = bytesToField(incrementByBytes.bytes.slice(0, 20));
        // Provable.asProver(() => {
        //   console.log(`num to add in circuit ${input.index.toBigInt()}: ${numToAdd.toBigInt()}`);
        // });

        const newCounter = Provable.if(
          isNotFirst.and(isLast.not()),
          counter.add(numToAdd),
          counter
        );
        const currentStateHash = Poseidon.hashPacked(Field, newCounter);

        blobInclusionProof.verifyIf(blobInclusionVk, isLast);
        Provable.assertEqualIf(
          isLast,
          Field,
          input.blobInclusionVkHash,
          blobInclusionVk.hash
        );
        const currentRollingHash = hashToFields(H);
        const currentRollingHashBytes = H.flatMap((x) =>
          wordToBytes(x.value, 4).reverse()
        );

        // Provable.asProver(() => {
        //   console.log(`current H ${input.index.toBigInt()}: ${H.map(x=>x.toBigint())}`);
        //   console.log(`current rolling hash bytes ${input.index.toBigInt()}: ${Buffer.from(currentRollingHashBytes.map(x=>x.toNumber())).toString('hex')}`);
        // });

        Provable.assertEqualIf(
          isLast,
          Bytes32.provable,
          blobInclusionProof.publicInput.digest,
          Bytes32.from(currentRollingHashBytes)
        );

        /*return new BatcherOutput({
            initialStateHash: Provable.if(isFirst, Field, input.currentStateHash, previousProof.publicOutput.initialStateHash),
            currentStateHash,
            currentRollingHash,
            dataCommitment: Bytes32.from(dataCommitment),
          });*/

        return {
          publicOutput: new BatcherOutput({
            initialStateHash: Provable.if(
              isFirst,
              Field,
              input.currentStateHash,
              previousProof.publicOutput.initialStateHash
            ),
            currentStateHash,
            currentRollingHash,
            dataCommitment: Bytes32.from(dataCommitment),
          }),
        };
      },
    },
  },
});

const BatcherProof = ZkProgram.Proof(batcherVerifier);
export {
  batcherVerifier,
  BatcherProof,
  BatcherInput,
  BatcherOutput,
  Bytes29,
  Bytes64,
  BatcherDynamicProof,
  BlobInclusionDynamicProof,
  bytesToField,
};
