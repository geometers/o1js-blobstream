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
  } from 'o1js';
import { FrC } from '../towers/index.js';
import { NodeProofLeft } from '../structs.js';
import { parsePublicInputs, parsePublicInputsProvable } from '../plonk/parse_pi.js';
import { bytesToWord, provableBn254ScalarFieldToBytes, wordToBytes } from '../sha/utils.js';
import fs from 'fs';
import { blob } from 'stream/consumers';
import { Bytes32 } from './verify_blobstream.js';
import { BlobInclusionInput, BlobInclusionProof } from './verify_blob_inclusion.js';

const workDir = process.env.BLOB_INCLUSION_WORK_DIR as string;

// 1. first proof in the chain includes initial state, which is carried to the end
// 2. subsequent proofs verify previous proof and add to the rolling hash
// 3. 10th proof calls verify_blob_inclusion with the rolling hash

class Bytes29 extends Bytes(29) {}
class Bytes64 extends Bytes(64) {}

const Bytes212Padding = [
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
    UInt8.from(0x74n), 
    UInt8.from(0x08n), 
]

class BatcherInput extends Struct({
  currentStateHash: Field,
  index: Field,
  namespaceHash: Field,
  currentRollingHash: Provable.Array(Field, 2),
}) {}

class BatcherOutput extends Struct({
  initialStateHash: Field,
  currentStateHash: Field,
  currentRollingHash: Provable.Array(Field, 2),
}) {}

const BATCH_SIZE=4;

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
};

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

const batcherVerifier = ZkProgram({
    name: 'batcherVerifier',
    publicInput: BatcherInput,
    publicOutput: BatcherOutput,
    methods: {
      compute: {
        privateInputs: [SelfProof, BlobInclusionProof, Field, Bytes64.provable, Bytes29.provable],
        async method(
            input: BatcherInput,
            previousProof: SelfProof<BatcherInput, BatcherOutput>,
            blobInclusionProof: Proof<BlobInclusionInput, Undefined>,
            counter: Field,
            incrementByBytes: Bytes64,
            namespace: Bytes29,
        ) {
          const isFirst = input.index.equals(Field(0))
          const isNotFirst = isFirst.not();
          Provable.assertEqualIf(isNotFirst, Field, input.index, previousProof.publicInput.index.add(Field(1)));
          previousProof.verifyIf(isNotFirst);
          const isLast = input.index.equals(Field(BATCH_SIZE));

          input.currentStateHash.assertEquals(Poseidon.hashPacked(Field, counter));

          input.namespaceHash.assertEquals(Poseidon.hashPacked(Bytes29.provable, namespace));

          let namespaceBytes: UInt8[] = []; 
          namespaceBytes = namespaceBytes.concat([
              UInt8.from(29n),
              ...Array(15).fill(UInt8.from(0)),
          ]);    
          namespaceBytes = namespaceBytes.concat(namespace.bytes);    
          namespaceBytes = namespaceBytes.concat([
              ...Array(19).fill(UInt8.from(0)),
          ]);

          let lastBlockBytes: UInt8[] = incrementByBytes.bytes.slice(0, 20); 
          lastBlockBytes = lastBlockBytes.concat(Bytes212Padding);

          let bytesToHash = Provable.if(isFirst, new Bytes64(namespaceBytes), 
            Provable.if(isLast, new Bytes64(lastBlockBytes), incrementByBytes),
          );
          
          const chunks = [];
          for (let i = 0; i < bytesToHash.length; i += 4) {
              const chunk = UInt32.Unsafe.fromField(
                  bytesToWord(bytesToHash.bytes.slice(i, i + 4).reverse())
              )
              chunks.push(chunk);
          }

          let initialStateFields = hashToFields(Gadgets.SHA256.initialState);
          Provable.assertEqualIf(isFirst, Provable.Array(Field, 2), initialStateFields, input.currentRollingHash);

          let W = Gadgets.SHA256.createMessageSchedule(chunks); 
          let H = fieldsToHash(input.currentRollingHash);
          H = Gadgets.SHA256.compression(H, W)

          const newCounter = counter.add(bytesToField(incrementByBytes.bytes.slice(0, 20)));
          const currentStateHash = Poseidon.hashPacked(Field, newCounter);

          blobInclusionProof.verifyIf(isLast);
          const currentRollingHash = hashToFields(H);
          const currentRollingHashBytes = currentRollingHash.flatMap(x=>wordToBytes(x, 16));
          Provable.assertEqualIf(isLast, Bytes32.provable, blobInclusionProof.publicInput.digest, new Bytes32(currentRollingHashBytes));

          return new BatcherOutput({
            initialStateHash: Provable.if(isFirst, input.currentStateHash, previousProof.publicOutput.initialStateHash),
            currentStateHash,
            currentRollingHash,
          });
        },
      },
    },
});

const BatcherProof = ZkProgram.Proof(batcherVerifier);
export { batcherVerifier, BatcherProof, BatcherInput };