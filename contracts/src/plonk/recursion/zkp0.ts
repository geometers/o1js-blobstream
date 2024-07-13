import {
    ZkProgram,
    Field,
    DynamicProof,
    Proof,
    VerificationKey,
    Undefined,
    verify,
    Provable,
    Struct,
    Poseidon,
    CanonicalForeignField
  } from 'o1js';
import { Accumulator } from '../accumulator.js';
import { VK } from '../vk.js';

const zkp0 = ZkProgram({
    name: 'zkp0',
    publicInput: Field,
    publicOutput: Field,
    methods: {
      compute: {
        privateInputs: [Accumulator],
        async method(
            input: Field,
            acc: Accumulator
        ) {
            const inDigest = Poseidon.hashPacked(Accumulator, acc);
            inDigest.assertEquals(input);

            acc.fs.squeezeGamma(acc.proof, acc.state.pi0, acc.state.pi1, VK)
            acc.fs.squeezeBeta()

            return Poseidon.hashPacked(Accumulator, acc);
        },
      },
    },
  });


const ZKP0Proof = ZkProgram.Proof(zkp0);
export { ZKP0Proof, zkp0 }